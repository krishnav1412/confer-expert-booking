import { z } from 'zod';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import Promotion from '../models/Promotion.js';
import Expert from '../models/Expert.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { createNotification } from './notificationController.js';

const PROMOTION_PLANS = {
  weekly: { amount: 2499, durationDays: 7, label: 'Weekly featured' },
  monthly: { amount: 7999, durationDays: 30, label: 'Monthly featured' },
};

const isLive = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

// POST /api/payments/booking-order
export const createBookingOrderSchema = z.object({
  bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/),
});

export const createBookingOrder = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (String(booking.userId) !== String(req.user._id)) throw new ApiError(403, 'Not your booking');
  if (booking.paymentStatus === 'paid') throw new ApiError(400, 'Already paid');

  const payment = await Payment.create({
    userId: req.user._id,
    purpose: 'booking',
    referenceId: booking._id,
    amount: booking.servicePrice,
    provider: isLive() ? 'razorpay' : 'mock',
    providerOrderId: isLive() ? '' : `mock_order_${booking._id}`,
    status: 'pending',
  });

  booking.paymentId = payment._id;
  await booking.save();

  res.json({
    success: true,
    data: {
      paymentId: payment._id,
      provider: payment.provider,
      orderId: payment.providerOrderId,
      amount: payment.amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || null,
      // In live mode, the frontend would now invoke Razorpay checkout
      // and post back razorpay_payment_id + razorpay_signature to /verify.
      mockMode: !isLive(),
    },
  });
});

// POST /api/payments/verify
export const verifyPaymentSchema = z.object({
  paymentId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId, razorpayPaymentId, razorpaySignature } = req.body;
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (String(payment.userId) !== String(req.user._id)) throw new ApiError(403, 'Not your payment');

  if (payment.provider === 'razorpay') {
    if (!razorpayPaymentId || !razorpaySignature) {
      throw new ApiError(400, 'Razorpay payment id and signature required');
    }
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${payment.providerOrderId}|${razorpayPaymentId}`)
      .digest('hex');
    if (expected !== razorpaySignature) throw new ApiError(400, 'Invalid Razorpay signature');
    payment.providerPaymentId = razorpayPaymentId;
    payment.providerSignature = razorpaySignature;
  } else {
    // Mock mode: instantly succeed
    payment.providerPaymentId = `mock_paid_${Date.now()}`;
  }

  payment.status = 'paid';
  await payment.save();

  // Apply payment to its target
  if (payment.purpose === 'booking') {
    const booking = await Booking.findByIdAndUpdate(
      payment.referenceId,
      { paymentStatus: 'paid', paymentId: payment._id },
      { new: true }
    );
    if (booking) {
      await createNotification({
        userId: booking.userId,
        type: 'payment_succeeded',
        title: 'Payment received',
        body: `${booking.serviceName} on ${booking.date} at ${booking.timeSlot}`,
        actionUrl: '/dashboard',
      });
    }
  } else if (payment.purpose === 'promotion') {
    const promo = await Promotion.findByIdAndUpdate(
      payment.referenceId,
      { status: 'active' },
      { new: true }
    );
    if (promo) {
      await Expert.findByIdAndUpdate(promo.expertId, {
        promoted: true,
        promotionEndsAt: promo.endsAt,
      });
      await createNotification({
        userId: promo.userId,
        type: 'promotion_active',
        title: 'Your profile boost is live',
        body: `Active until ${promo.endsAt.toDateString()}`,
        actionUrl: '/expert-dashboard',
      });
    }
  }

  res.json({ success: true, data: payment });
});

// POST /api/promotions
export const createPromotionSchema = z.object({
  plan: z.enum(['weekly', 'monthly']),
});

export const createPromotion = asyncHandler(async (req, res) => {
  if (req.user.role !== 'expert' || !req.user.isExpertApproved) {
    throw new ApiError(403, 'Only approved experts can promote their profile');
  }
  const expert = await Expert.findOne({ userId: req.user._id });
  if (!expert) throw new ApiError(404, 'No expert profile');

  const plan = PROMOTION_PLANS[req.body.plan];
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + plan.durationDays * 24 * 3600 * 1000);

  const promo = await Promotion.create({
    expertId: expert._id,
    userId: req.user._id,
    plan: req.body.plan,
    amount: plan.amount,
    status: 'pending',
    startsAt,
    endsAt,
  });

  const payment = await Payment.create({
    userId: req.user._id,
    purpose: 'promotion',
    referenceId: promo._id,
    amount: plan.amount,
    provider: isLive() ? 'razorpay' : 'mock',
    providerOrderId: isLive() ? '' : `mock_order_${promo._id}`,
    status: 'pending',
  });
  promo.paymentId = payment._id;
  await promo.save();

  res.status(201).json({
    success: true,
    data: {
      promotionId: promo._id,
      paymentId: payment._id,
      amount: plan.amount,
      provider: payment.provider,
      orderId: payment.providerOrderId,
      mockMode: !isLive(),
    },
  });
});

/**
 * POST /api/webhooks/razorpay
 * Razorpay calls this to notify of payment state changes. Verified via
 * X-Razorpay-Signature HMAC against the raw request body (must be mounted
 * with express.raw, see app.js).
 *
 * This endpoint is idempotent — receiving the same event twice has no effect.
 */
export const razorpayWebhook = asyncHandler(async (req, res) => {
  if (!isLive()) {
    return res.status(200).json({ success: true, message: 'Mock mode — webhook ignored' });
  }

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  if (!signature) throw new ApiError(400, 'Missing webhook signature');

  const rawBody = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body));
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (expected !== signature) throw new ApiError(400, 'Invalid webhook signature');

  const event = JSON.parse(rawBody.toString('utf8'));
  const entity =
    event?.payload?.payment?.entity ||
    event?.payload?.order?.entity ||
    {};

  const orderId = entity.order_id || entity.id;
  if (!orderId) return res.status(200).json({ success: true });

  const payment = await Payment.findOne({ providerOrderId: orderId });
  if (!payment) return res.status(200).json({ success: true, message: 'Unknown order' });

  // Idempotency: if already finalised, ignore.
  if (payment.status === 'paid' || payment.status === 'failed') {
    return res.status(200).json({ success: true });
  }

  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    payment.status = 'paid';
    payment.providerPaymentId = entity.id;
    await payment.save();

    if (payment.purpose === 'booking') {
      const booking = await Booking.findById(payment.bookingId);
      if (booking) {
        booking.paymentStatus = 'paid';
        booking.paymentId = payment._id;
        booking.status = booking.status === 'Pending' ? 'Confirmed' : booking.status;
        await booking.save();
      }
    } else if (payment.purpose === 'promotion') {
      const promo = await Promotion.findById(payment.promotionId);
      if (promo && promo.status !== 'active') {
        promo.status = 'active';
        promo.startsAt = new Date();
        promo.endsAt = new Date(Date.now() + promo.durationDays * 86400_000);
        await promo.save();
        await Expert.findByIdAndUpdate(promo.expertId, {
          promoted: true,
          promotionEndsAt: promo.endsAt,
        });
      }
    }
  } else if (event.event === 'payment.failed') {
    payment.status = 'failed';
    await payment.save();

    if (payment.purpose === 'booking') {
      const booking = await Booking.findById(payment.bookingId);
      if (booking && booking.paymentStatus !== 'paid') {
        booking.paymentStatus = 'failed';
        await booking.save();
      }
    }
  }

  res.status(200).json({ success: true });
});

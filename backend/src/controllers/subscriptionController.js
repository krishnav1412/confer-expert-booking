import { z } from 'zod';

import Expert from '../models/Expert.js';
import Subscription from '../models/Subscription.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { resolveServiceSnapshot } from './bookingController.js';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/);
const recurringDaysSchema = z
  .array(z.coerce.number().int().min(0).max(6))
  .min(1)
  .max(7)
  .refine((days) => new Set(days).size === days.length, {
    message: 'Recurring days must be unique',
  });

export const createSubscriptionSchema = z.object({
  expertId: objectIdSchema,
  serviceId: objectIdSchema.optional(),
  plan: z.enum(['monthly', 'yearly']),
  recurringDays: recurringDaysSchema,
  sessionTime: z.string().trim().min(1).max(20),
  timezone: z.string().trim().max(80).optional(),
  renewalDate: z.coerce.date().optional(),
  autoRenew: z.boolean().optional().default(true),
});

export const subscriptionReasonSchema = z.object({
  reason: z.string().trim().max(500).optional().default(''),
}).optional().default({});

export const resumeSubscriptionSchema = z.object({
  renewalDate: z.coerce.date().optional(),
}).optional().default({});

export const renewSubscriptionSchema = z.object({
  renewalDate: z.coerce.date().optional(),
  autoRenew: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional().default({}),
}).optional().default({});

// POST /api/subscriptions
export const createSubscription = asyncHandler(async (req, res) => {
  const { expertId, serviceId, plan, recurringDays, sessionTime, timezone, autoRenew } = req.body;

  const expert = await Expert.findById(expertId);
  if (!expert) throw new ApiError(404, 'Expert not found');
  if (String(expert.userId) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot subscribe to your own profile');
  }

  const service = resolveServiceSnapshot(expert, serviceId);
  const renewalDate = req.body.renewalDate || calculateNextRenewalDate(new Date(), plan);

  const subscription = await Subscription.create({
    userId: req.user._id,
    expertId: expert._id,
    plan,
    serviceSnapshot: {
      serviceId: service.serviceId,
      name: service.serviceName,
      price: service.servicePrice,
      durationMinutes: service.serviceDuration,
    },
    recurringDays,
    sessionTime,
    timezone: timezone || req.user.timezone || expert.timezone || 'Asia/Kolkata',
    renewalDate,
    expiresAt: renewalDate,
    autoRenew,
  });

  res.status(201).json({
    success: true,
    data: subscription,
    message: 'Subscription created successfully',
  });
});

// GET /api/subscriptions/me
export const getMySubscriptions = asyncHandler(async (req, res) => {
  const ownedExpert = await Expert.findOne({ userId: req.user._id }).select('_id').lean();
  const filter = ownedExpert
    ? { $or: [{ userId: req.user._id }, { expertId: ownedExpert._id }] }
    : { userId: req.user._id };

  const subscriptions = await populateSubscriptionQuery(
    Subscription.find(filter).sort({ createdAt: -1 })
  ).lean();

  res.json({ success: true, data: subscriptions });
});

// GET /api/subscriptions/:id
export const getSubscriptionById = asyncHandler(async (req, res) => {
  await assertCanViewSubscription(req.params.id, req.user);
  const subscription = await findSubscriptionDetail(req.params.id);
  res.json({ success: true, data: subscription });
});

// POST /api/subscriptions/:id/pause
export const pauseSubscription = asyncHandler(async (req, res) => {
  const { subscription, isClient, isAdmin } = await getSubscriptionAccess(req.params.id, req.user);
  if (!isClient && !isAdmin) throw new ApiError(403, 'Only the subscriber can pause this subscription');
  if (subscription.status === 'cancelled') throw new ApiError(400, 'Cancelled subscriptions cannot be paused');

  await subscription.pause(req.body.reason);
  const updated = await findSubscriptionDetail(subscription._id);

  res.json({ success: true, data: updated, message: 'Subscription paused' });
});

// POST /api/subscriptions/:id/resume
export const resumeSubscription = asyncHandler(async (req, res) => {
  const { subscription, isClient, isAdmin } = await getSubscriptionAccess(req.params.id, req.user);
  if (!isClient && !isAdmin) throw new ApiError(403, 'Only the subscriber can resume this subscription');
  if (subscription.status === 'cancelled') throw new ApiError(400, 'Cancelled subscriptions cannot be resumed');

  await subscription.resume(req.body.renewalDate || null);
  const updated = await findSubscriptionDetail(subscription._id);

  res.json({ success: true, data: updated, message: 'Subscription resumed' });
});

// POST /api/subscriptions/:id/cancel
export const cancelSubscription = asyncHandler(async (req, res) => {
  const { subscription, isClient, isAdmin } = await getSubscriptionAccess(req.params.id, req.user);
  if (!isClient && !isAdmin) throw new ApiError(403, 'Only the subscriber can cancel this subscription');

  await subscription.cancel(req.body.reason);
  const updated = await findSubscriptionDetail(subscription._id);

  res.json({ success: true, data: updated, message: 'Subscription cancelled' });
});

// POST /api/subscriptions/:id/renew
export const renewSubscription = asyncHandler(async (req, res) => {
  const { subscription, isClient, isAdmin } = await getSubscriptionAccess(req.params.id, req.user);
  if (!isClient && !isAdmin) throw new ApiError(403, 'Only the subscriber can renew this subscription');
  if (subscription.status === 'cancelled') throw new ApiError(400, 'Cancelled subscriptions cannot be renewed');

  if (req.body.autoRenew !== undefined) subscription.autoRenew = req.body.autoRenew;
  await subscription.renew(req.body.renewalDate || null, req.body.metadata || {});
  const updated = await findSubscriptionDetail(subscription._id);

  res.json({ success: true, data: updated, message: 'Subscription renewed' });
});

const populateSubscriptionQuery = (query) =>
  query
    .populate('expertId', 'name category profileImage company')
    .populate('userId', 'name email avatar')
    .populate({
      path: 'generatedBookingIds',
      select: 'date timeSlot status paymentStatus serviceName servicePrice serviceDuration bookingType sequenceNumber createdAt',
      options: { sort: { date: 1, createdAt: 1 } },
    });

const findSubscriptionDetail = (id) => populateSubscriptionQuery(Subscription.findById(id)).lean();

const assertCanViewSubscription = async (subscriptionId, user) => {
  const access = await getSubscriptionAccess(subscriptionId, user);
  if (!access.isClient && !access.isExpert && !access.isAdmin) {
    throw new ApiError(403, 'You cannot access this subscription');
  }
};

const getSubscriptionAccess = async (subscriptionId, user) => {
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) throw new ApiError(404, 'Subscription not found');

  const isClient = String(subscription.userId) === String(user._id);
  const expert = await Expert.findById(subscription.expertId).select('userId');
  const isExpert = expert && String(expert.userId) === String(user._id);
  const isAdmin = user.role === 'admin';

  return { subscription, isClient, isExpert, isAdmin };
};

const calculateNextRenewalDate = (fromDate, plan) => {
  const next = new Date(fromDate);
  if (plan === 'yearly') next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next;
};

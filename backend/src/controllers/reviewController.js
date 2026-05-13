import { z } from 'zod';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Expert from '../models/Expert.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { createNotification } from './notificationController.js';

export const createReviewSchema = z.object({
  bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  rating: z.coerce.number().min(1).max(5),
  text: z.string().trim().min(10, 'Tell us a bit more').max(1500),
});

export const expertReplySchema = z.object({
  text: z.string().trim().min(2).max(1000),
});

// GET /api/reviews?expertId=...  (public)
export const listReviews = asyncHandler(async (req, res) => {
  const { expertId } = req.query;
  if (!expertId) throw new ApiError(400, 'expertId is required');

  const sortKey = req.query.sort || 'recent';
  const sort = sortKey === 'topRated' ? { rating: -1, createdAt: -1 } : { createdAt: -1 };

  const reviews = await Review.find({ expertId }).sort(sort).lean();
  res.json({ success: true, data: reviews });
});

// POST /api/reviews  (auth required, only on completed bookings)
export const createReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, text } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (String(booking.userId) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only review your own bookings');
  }
  if (booking.status !== 'Completed') {
    throw new ApiError(400, 'You can only review completed sessions');
  }

  // Prevent duplicate
  const dupe = await Review.findOne({ userId: req.user._id, bookingId });
  if (dupe) throw new ApiError(409, 'You already reviewed this session');

  const expert = await Expert.findById(booking.expertId).select('userId');

  const review = await Review.create({
    expertId: booking.expertId,
    userId: req.user._id,
    bookingId: booking._id,
    reviewerName: req.user.name,
    reviewerImage: req.user.avatar || '',
    rating,
    text,
    verified: true,
  });

  booking.reviewedAt = new Date();
  await booking.save();

  // Recompute expert rating
  const all = await Review.find({ expertId: booking.expertId }).select('rating');
  if (all.length > 0) {
    const avg = all.reduce((acc, r) => acc + r.rating, 0) / all.length;
    await Expert.findByIdAndUpdate(booking.expertId, { rating: Number(avg.toFixed(1)) });
  }

  if (expert?.userId) {
    await createNotification({
      userId: expert.userId,
      type: 'review_received',
      title: `New ${rating}-star review from ${req.user.name}`,
      body: text.slice(0, 120),
      actionUrl: '/expert-dashboard',
      metadata: { reviewId: String(review._id) },
    });
  }

  res.status(201).json({ success: true, data: review, message: 'Thanks for your review' });
});

// POST /api/reviews/:id/reply  (expert who owns the profile)
export const replyToReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');

  const expert = await Expert.findById(review.expertId).select('userId');
  if (!expert || String(expert.userId) !== String(req.user._id)) {
    throw new ApiError(403, 'Only the expert can reply to their reviews');
  }

  review.expertReply = { expertUserId: req.user._id, text: req.body.text };
  await review.save();
  res.json({ success: true, data: review });
});

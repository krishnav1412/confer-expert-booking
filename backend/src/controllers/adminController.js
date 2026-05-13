import { z } from 'zod';

import User from '../models/User.js';
import Expert from '../models/Expert.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import Conversation from '../models/Conversation.js';
import ExpertApplication from '../models/ExpertApplication.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';

import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  return { page, limit, skip: (page - 1) * limit };
};

// ============================================================================
// Dashboard stats
// ============================================================================

/**
 * GET /api/admin/stats
 * High-level platform numbers for the admin overview.
 */
export const getStats = asyncHandler(async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000);

  const [
    totalUsers,
    totalExperts,
    totalAdmins,
    pendingApplications,
    bookingsTotal,
    bookingsCompleted,
    bookingsCancelled,
    bookingsPaid,
    suspendedUsers,
    activeConversations,
    pendingReviews,
    revenueAgg,
    weeklyBookings,
    monthlyBookings,
    recentSignupsCount,
  ] = await Promise.all([
    User.countDocuments({ role: { $in: ['user', 'expert'] } }),
    User.countDocuments({ role: 'expert', isExpertApproved: true }),
    User.countDocuments({ role: 'admin' }),
    ExpertApplication.countDocuments({ status: 'Under Review' }),
    Booking.countDocuments({}),
    Booking.countDocuments({ status: 'Completed' }),
    Booking.countDocuments({ status: 'Cancelled' }),
    Booking.countDocuments({ paymentStatus: 'paid' }),
    User.countDocuments({ isSuspended: true }),
    Conversation.countDocuments({ lastMessageAt: { $gte: sevenDaysAgo } }),
    Review.countDocuments({}),
    Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$servicePrice' } } },
    ]),
    Booking.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Booking.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
  ]);

  const totalRevenue = revenueAgg?.[0]?.total || 0;

  res.json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        experts: totalExperts,
        admins: totalAdmins,
        suspended: suspendedUsers,
        newThisWeek: recentSignupsCount,
      },
      applications: { pending: pendingApplications },
      bookings: {
        total: bookingsTotal,
        completed: bookingsCompleted,
        cancelled: bookingsCancelled,
        paid: bookingsPaid,
        last7d: weeklyBookings,
        last30d: monthlyBookings,
      },
      reviews: { total: pendingReviews },
      activeConversations,
      revenue: { totalPaid: totalRevenue },
    },
  });
});

// ============================================================================
// User management
// ============================================================================

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const search = (req.query.search || '').trim();
  const role = req.query.role;
  const status = req.query.status; // 'active' | 'suspended'

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (role && ['user', 'expert', 'admin'].includes(role)) filter.role = role;
  if (status === 'suspended') filter.isSuspended = true;
  if (status === 'active') filter.isSuspended = { $ne: true };

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -passwordResetTokenHash -passwordResetExpiresAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getUserDetail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -passwordResetTokenHash -passwordResetExpiresAt')
    .populate('expertProfile', 'category company rating reviewCount featured promoted')
    .lean();
  if (!user) throw new ApiError(404, 'User not found');

  const [bookingCount, reviewCount, conversationCount] = await Promise.all([
    Booking.countDocuments({ userId: user._id }),
    Review.countDocuments({ userId: user._id }),
    Conversation.countDocuments({
      $or: [{ userId: user._id }, { expertUserId: user._id }],
    }),
  ]);

  res.json({
    success: true,
    data: { ...user, bookingCount, reviewCount, conversationCount },
  });
});

export const suspendUserSchema = z.object({
  reason: z.string().trim().max(500).optional().or(z.literal('')),
});

export const suspendUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(403, 'Cannot suspend an admin account');

  user.isSuspended = true;
  user.suspensionReason = (req.body.reason || '').trim();
  user.suspendedAt = new Date();
  await user.save();

  res.json({ success: true, data: { id: user._id, isSuspended: true } });
});

export const unsuspendUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  user.isSuspended = false;
  user.suspensionReason = '';
  user.suspendedAt = null;
  await user.save();

  res.json({ success: true, data: { id: user._id, isSuspended: false } });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(403, 'Cannot delete an admin account');
  if (String(user._id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot delete your own account from the admin panel');
  }

  // Soft-cleanup: keep bookings/reviews for ledger integrity, scrub PII.
  await User.findByIdAndUpdate(user._id, {
    $set: {
      name: 'Deleted User',
      email: `deleted-${user._id}@confer.deleted`,
      isSuspended: true,
      suspensionReason: 'Account deleted by admin',
      suspendedAt: new Date(),
      avatar: '',
      bio: '',
      phone: '',
      socialLinks: { linkedin: '', twitter: '', website: '' },
    },
  });

  // Hide expert profile if any
  if (user.expertProfile) {
    await Expert.findByIdAndUpdate(user.expertProfile, {
      $set: { featured: false, promoted: false, isSuspended: true },
    });
  }

  res.json({ success: true, data: { id: user._id, deleted: true } });
});

// ============================================================================
// Expert management
// ============================================================================

export const listExperts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const search = (req.query.search || '').trim();
  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }
  if (req.query.featured === 'true') filter.featured = true;
  if (req.query.suspended === 'true') filter.isSuspended = true;

  const [experts, total] = await Promise.all([
    Expert.find(filter)
      .sort({ promoted: -1, featured: -1, rating: -1, createdAt: -1 })
      .skip(skip).limit(limit)
      .populate('userId', 'name email isSuspended')
      .lean(),
    Expert.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: experts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const toggleFeaturedExpert = asyncHandler(async (req, res) => {
  const expert = await Expert.findById(req.params.id);
  if (!expert) throw new ApiError(404, 'Expert not found');
  expert.featured = !expert.featured;
  if (expert.featured && !expert.badges?.includes('Featured Expert')) {
    expert.badges = [...(expert.badges || []), 'Featured Expert'];
  } else if (!expert.featured) {
    expert.badges = (expert.badges || []).filter((b) => b !== 'Featured Expert');
  }
  await expert.save();
  res.json({ success: true, data: { id: expert._id, featured: expert.featured } });
});

export const suspendExpert = asyncHandler(async (req, res) => {
  const expert = await Expert.findById(req.params.id);
  if (!expert) throw new ApiError(404, 'Expert not found');
  expert.isSuspended = true;
  expert.featured = false;
  expert.promoted = false;
  await expert.save();
  res.json({ success: true, data: { id: expert._id, isSuspended: true } });
});

export const unsuspendExpert = asyncHandler(async (req, res) => {
  const expert = await Expert.findById(req.params.id);
  if (!expert) throw new ApiError(404, 'Expert not found');
  expert.isSuspended = false;
  await expert.save();
  res.json({ success: true, data: { id: expert._id, isSuspended: false } });
});

// ============================================================================
// Review moderation
// ============================================================================

export const listReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.expertId) filter.expertId = req.query.expertId;
  if (req.query.minRating) filter.rating = { $gte: parseInt(req.query.minRating, 10) };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit)
      .populate('expertId', 'name category')
      .populate('userId', 'name email')
      .lean(),
    Review.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: reviews,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');

  const expertId = review.expertId;
  await review.deleteOne();

  // Recompute aggregate
  const agg = await Review.aggregate([
    { $match: { expertId } },
    { $group: { _id: '$expertId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const next = agg[0] || { avg: 0, count: 0 };
  await Expert.findByIdAndUpdate(expertId, {
    rating: Math.round(next.avg * 10) / 10,
    reviewCount: next.count,
  });

  res.json({ success: true, data: { id: req.params.id, deleted: true } });
});

// ============================================================================
// Booking inspection
// ============================================================================

export const listBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit)
      .populate('expertId', 'name category company')
      .populate('userId', 'name email')
      .lean(),
    Booking.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: bookings,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

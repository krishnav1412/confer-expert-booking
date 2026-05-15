import { z } from 'zod';
import Expert from '../models/Expert.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import Promotion from '../models/Promotion.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

// ---------- PUBLIC ----------

// GET /api/experts
export const getExperts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 9, 50);
  const skip = (page - 1) * limit;

  const filter = { isSuspended: { $ne: true } };
  if (req.query.category && req.query.category !== 'All') filter.category = req.query.category;
  if (req.query.search) {
    const regex = new RegExp(req.query.search.trim(), 'i');
    filter.$or = [{ name: regex }, { bio: regex }, { skills: regex }, { company: regex }];
  }
  if (req.query.featured === 'true') filter.featured = true;
  if (req.query.minRating) filter.rating = { $gte: parseFloat(req.query.minRating) };
  if (req.query.minExp) filter.experience = { ...(filter.experience || {}), $gte: parseInt(req.query.minExp, 10) };
  if (req.query.maxPrice) filter.price = { $lte: parseInt(req.query.maxPrice, 10) };

  const sortKey = req.query.sort || 'featured';
  const sort =
    sortKey === 'rating' ? { rating: -1, featured: -1 } :
    sortKey === 'priceAsc' ? { price: 1 } :
    sortKey === 'priceDesc' ? { price: -1 } :
    sortKey === 'experience' ? { experience: -1 } :
    { promoted: -1, featured: -1, rating: -1, createdAt: -1 };

  const [experts, total] = await Promise.all([
    Expert.find(filter)
      .select('-availableSlots -faqs -weeklyTemplate -blockedDates')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Expert.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: experts,
    pagination: { page, pages: Math.ceil(total / limit) || 1, total, limit },
  });
});

export const getFeaturedExperts = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 4, 12);
  const experts = await Expert.find({
    isSuspended: { $ne: true },
    $or: [{ featured: true }, { promoted: true }],
  })
    .select('-availableSlots -faqs -weeklyTemplate -blockedDates -deliverables')
    .sort({ promoted: -1, rating: -1 })
    .limit(limit)
    .lean();
  res.json({ success: true, data: experts });
});

export const getCategories = asyncHandler(async (_req, res) => {
  const grouped = await Expert.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
    { $sort: { count: -1 } },
  ]);
  res.json({
    success: true,
    data: grouped.map((g) => ({
      name: g._id,
      count: g.count,
      avgRating: Number(g.avgRating?.toFixed(1) || 0),
    })),
  });
});

export const getExpertById = asyncHandler(async (req, res) => {
  const expert = await Expert.findById(req.params.id).lean();
  if (!expert) throw new ApiError(404, 'Expert not found');

  const [bookings, reviews] = await Promise.all([
    Booking.find({ expertId: expert._id, status: { $ne: 'Cancelled' } })
      .select('date timeSlot status')
      .lean(),
    Review.find({ expertId: expert._id }).sort({ createdAt: -1 }).lean(),
  ]);

  const bookedMap = new Map();
  bookings.forEach((b) => {
    if (!bookedMap.has(b.date)) bookedMap.set(b.date, new Set());
    bookedMap.get(b.date).add(b.timeSlot);
  });

  expert.availableSlots = (expert.availableSlots || []).map((g) => ({
    date: g.date,
    slots: g.slots.map((slot) => ({
      time: slot,
      booked: bookedMap.get(g.date)?.has(slot) || false,
    })),
  }));

  if (reviews.length > 0) {
    const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    expert.rating = Number(avg.toFixed(1));
  }
  expert.reviews = reviews;
  expert.reviewCount = reviews.length;

  // Hide internal fields
  delete expert.weeklyTemplate;
  delete expert.blockedDates;

  res.json({ success: true, data: expert });
});

// ---------- AUTHENTICATED EXPERT MANAGEMENT ----------

const serviceUpdateSchema = z.object({
  _id: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().default(''),
  price: z.coerce.number().min(0),
  durationMinutes: z.coerce.number().min(15).max(480),
  active: z.boolean().optional(),
});

export const updateExpertProfileSchema = z.object({
  bio: z.string().trim().min(20).max(2000).optional(),
  company: z.string().trim().max(120).optional(),
  experience: z.coerce.number().min(0).max(60).optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  profileImage: z.string().trim().url().optional().or(z.literal('')),
  linkedinUrl: z.string().trim().url().optional().or(z.literal('')),
  websiteUrl: z.string().trim().url().optional().or(z.literal('')),
  deliverables: z.array(z.string().trim().min(1).max(140)).max(10).optional(),
  faqs: z
    .array(z.object({ question: z.string().trim().min(3).max(200), answer: z.string().trim().min(3).max(800) }))
    .max(10)
    .optional(),
  services: z.array(serviceUpdateSchema).max(8).optional(),
  timezone: z.string().trim().max(80).optional(),
  maxBookingsPerDay: z.coerce.number().min(1).max(50).optional(),
});

const availabilitySchema = z.object({
  weeklyTemplate: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        enabled: z.boolean(),
        slots: z.array(z.string().trim().min(1).max(20)).max(24),
      })
    )
    .max(7)
    .optional(),
  blockedDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(366).optional(),
  availableSlots: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        slots: z.array(z.string().trim().min(1).max(20)).max(24),
      })
    )
    .max(60)
    .optional(),
});

export { availabilitySchema };

// GET /api/experts/me  — owner-only full record
export const getMyExpertProfile = asyncHandler(async (req, res) => {
  const expert = await Expert.findOne({ userId: req.user._id }).lean();
  if (!expert) throw new ApiError(404, 'No expert profile yet');
  res.json({ success: true, data: expert });
});

// PATCH /api/experts/me
export const updateMyExpertProfile = asyncHandler(async (req, res) => {
  const expert = await Expert.findOne({ userId: req.user._id });
  if (!expert) throw new ApiError(404, 'No expert profile yet');

  const allowed = [
    'bio', 'company', 'experience', 'skills', 'profileImage',
    'linkedinUrl', 'websiteUrl', 'deliverables', 'faqs', 'timezone',
    'maxBookingsPerDay',
  ];
  allowed.forEach((k) => { if (req.body[k] !== undefined) expert[k] = req.body[k]; });

  if (Array.isArray(req.body.services)) {
    expert.services = req.body.services;
    if (expert.services.length > 0) {
      expert.price = Math.min(...expert.services.map((s) => s.price));
    }
  }

  await expert.save();
  res.json({ success: true, data: expert.toObject(), message: 'Profile updated' });
});

// PATCH /api/experts/me/availability
export const updateMyAvailability = asyncHandler(async (req, res) => {
  const expert = await Expert.findOne({ userId: req.user._id });
  if (!expert) throw new ApiError(404, 'No expert profile yet');

  if (req.body.weeklyTemplate !== undefined) expert.weeklyTemplate = req.body.weeklyTemplate;
  if (req.body.blockedDates !== undefined) expert.blockedDates = req.body.blockedDates;
  if (req.body.availableSlots !== undefined) expert.availableSlots = req.body.availableSlots;

  await expert.save();
  res.json({ success: true, data: expert.toObject(), message: 'Availability updated' });
});

// GET /api/experts/me/analytics
export const getMyAnalytics = asyncHandler(async (req, res) => {
  const expert = await Expert.findOne({ userId: req.user._id });
  if (!expert) throw new ApiError(404, 'No expert profile yet');

  const [bookings, activePromotion] = await Promise.all([
    Booking.find({ expertId: expert._id }).lean(),
    Promotion.findOne({
      expertId: expert._id,
      status: 'active',
      endsAt: { $gte: new Date() },
    }).lean(),
  ]);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = bookings.filter((b) => b.date >= today && b.status !== 'Cancelled' && b.status !== 'Completed');
  const completed = bookings.filter((b) => b.status === 'Completed');
  const cancelled = bookings.filter((b) => b.status === 'Cancelled');
  const revenue = completed.reduce((acc, b) => acc + (b.servicePrice || 0), 0);
  const pendingRevenue = upcoming
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((acc, b) => acc + (b.servicePrice || 0), 0);

  // Booking trend last 30 days
  const trend = {};
  const now = new Date();
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    trend[d.toISOString().split('T')[0]] = 0;
  }
  bookings.forEach((b) => {
    const key = new Date(b.createdAt).toISOString().split('T')[0];
    if (key in trend) trend[key] += 1;
  });

  const uniqueClients = new Set(bookings.map((b) => String(b.userId))).size;

  res.json({
    success: true,
    data: {
      profileViews: expert.stats?.profileViews || 0,
      sessionsCompleted: completed.length,
      upcomingSessions: upcoming.length,
      cancelledSessions: cancelled.length,
      revenue,
      pendingRevenue,
      uniqueClients,
      averageRating: expert.rating,
      bookingTrend: Object.entries(trend).map(([date, count]) => ({ date, count })),
      activePromotion: activePromotion
        ? { plan: activePromotion.plan, endsAt: activePromotion.endsAt }
        : null,
    },
  });
});

import { z } from 'zod';
import User from '../models/User.js';
import Expert from '../models/Expert.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  bio: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  timezone: z.string().trim().max(80).optional(),
  avatar: z.string().trim().url().optional().or(z.literal('')),
  socialLinks: z
    .object({
      linkedin: z.string().trim().url().optional().or(z.literal('')),
      twitter: z.string().trim().url().optional().or(z.literal('')),
      website: z.string().trim().url().optional().or(z.literal('')),
    })
    .optional(),
  notificationPrefs: z
    .object({
      bookingEmail: z.boolean().optional(),
      messageEmail: z.boolean().optional(),
      marketingEmail: z.boolean().optional(),
    })
    .optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72)
      .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// PATCH /api/users/me
export const updateMe = asyncHandler(async (req, res) => {
  const allowed = ['name', 'bio', 'phone', 'timezone', 'avatar', 'socialLinks', 'notificationPrefs'];
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) {
      if (k === 'socialLinks' || k === 'notificationPrefs') {
        req.user[k] = { ...(req.user[k]?.toObject?.() || req.user[k] || {}), ...req.body[k] };
      } else {
        req.user[k] = req.body[k];
      }
    }
  });
  await req.user.save();
  res.json({ success: true, data: { user: req.user.toPublicJSON() }, message: 'Profile updated' });
});

// POST /api/users/me/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  const ok = await user.verifyPassword(currentPassword);
  if (!ok) throw new ApiError(401, 'Current password is incorrect');
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed' });
});

// POST /api/users/me/favorites/:expertId
export const toggleFavorite = asyncHandler(async (req, res) => {
  const { expertId } = req.params;
  const expert = await Expert.findById(expertId).select('_id');
  if (!expert) throw new ApiError(404, 'Expert not found');

  const idx = req.user.favoriteExperts.findIndex((id) => String(id) === String(expertId));
  if (idx === -1) req.user.favoriteExperts.push(expert._id);
  else req.user.favoriteExperts.splice(idx, 1);
  await req.user.save();
  res.json({ success: true, data: { favorites: req.user.favoriteExperts } });
});

// GET /api/users/me/favorites
export const listFavorites = asyncHandler(async (req, res) => {
  const populated = await User.findById(req.user._id).populate({
    path: 'favoriteExperts',
    select: '-availableSlots -faqs -weeklyTemplate -blockedDates',
  });
  res.json({ success: true, data: populated.favoriteExperts });
});

// POST /api/users/me/recently-viewed/:expertId
export const trackView = asyncHandler(async (req, res) => {
  const { expertId } = req.params;
  const exists = await Expert.exists({ _id: expertId });
  if (!exists) throw new ApiError(404, 'Expert not found');

  // Increment view counter
  await Expert.findByIdAndUpdate(expertId, { $inc: { 'stats.profileViews': 1 } });

  // Maintain a small dedup list (max 12)
  req.user.recentlyViewed = [
    { expertId, viewedAt: new Date() },
    ...req.user.recentlyViewed.filter((rv) => String(rv.expertId) !== String(expertId)),
  ].slice(0, 12);
  await req.user.save();
  res.json({ success: true });
});

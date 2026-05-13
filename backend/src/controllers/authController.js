import { z } from 'zod';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { signToken } from '../middleware/authMiddleware.js';
import emailService from '../services/emailService.js';

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password is too long')
      .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const sanitiseUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar || '',
  bio: user.bio || '',
  timezone: user.timezone,
  phone: user.phone || '',
  socialLinks: user.socialLinks || {},
  role: user.role,
  isExpertApproved: !!user.isExpertApproved,
  expertProfile: user.expertProfile || null,
  notificationPrefs: user.notificationPrefs || {},
  favoriteExperts: user.favoriteExperts || [],
  createdAt: user.createdAt,
});

// POST /api/auth/signup
export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({ name, email, password });
  const token = signToken(user._id);
  user.lastLoginAt = new Date();
  await user.save();

  // Fire-and-forget transactional email
  emailService.sendWelcomeEmail(user);

  res.status(201).json({
    success: true,
    data: { token, user: sanitiseUser(user) },
    message: 'Welcome to Confer',
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const match = await user.verifyPassword(password);
  if (!match) throw new ApiError(401, 'Invalid email or password');
  if (user.isSuspended) throw new ApiError(403, 'Your account has been suspended');

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user._id);
  res.json({
    success: true,
    data: { token, user: sanitiseUser(user) },
    message: 'Welcome back',
  });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  const fresh = await User.findById(req.user._id).populate('expertProfile', 'name profileImage category');
  res.json({ success: true, data: { user: sanitiseUser(fresh) } });
});

// POST /api/auth/logout — client just discards the token; this endpoint exists for symmetry
export const logout = asyncHandler(async (_req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

import crypto from 'node:crypto';
import { z } from 'zod';

import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import emailService from '../services/emailService.js';

const RESET_TTL_MINUTES = 60;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  newPassword: z
    .string()
    .min(8)
    .regex(/[a-zA-Z]/, 'Password must contain a letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * POST /api/auth/forgot-password
 * Always returns 200 to prevent email enumeration. If the email exists, an
 * email is dispatched in the background.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).select(
    '+passwordResetTokenHash +passwordResetExpiresAt'
  );

  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = hashToken(token);
    user.passwordResetExpiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60_000);
    await user.save({ validateBeforeSave: false });

    const base = process.env.PUBLIC_APP_URL || req.headers.origin || '';
    const resetUrl = `${base}/reset-password?token=${token}`;
    emailService.sendPasswordResetEmail(user, resetUrl);
  }

  res.json({
    success: true,
    message:
      'If an account with that email exists, a password reset link has been sent.',
  });
});

/**
 * POST /api/auth/reset-password
 * Body: { token, newPassword }
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const tokenHash = hashToken(token);

  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
  }).select('+password +passwordResetTokenHash +passwordResetExpiresAt');

  if (!user) {
    throw new ApiError(400, 'Reset link is invalid or has expired');
  }

  user.password = newPassword;
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await user.save();

  res.json({ success: true, message: 'Password updated. You can now sign in.' });
});

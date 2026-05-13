import { Router } from 'express';
import { signup, login, getMe, logout, signupSchema, loginSchema } from '../controllers/authController.js';
import {
  forgotPassword,
  resetPassword,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../controllers/passwordResetController.js';
import validate from '../middleware/validateMiddleware.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', requireAuth, getMe);
router.post('/logout', requireAuth, logout);

router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

export default router;

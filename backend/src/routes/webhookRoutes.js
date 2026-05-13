import { Router } from 'express';
import express from 'express';
import { razorpayWebhook } from '../controllers/paymentController.js';

const router = Router();

/**
 * Razorpay webhook. Mounted with express.raw so we can verify HMAC against
 * the original bytes before any JSON parser touches them.
 */
router.post(
  '/razorpay',
  express.raw({ type: '*/*', limit: '1mb' }),
  razorpayWebhook
);

export default router;

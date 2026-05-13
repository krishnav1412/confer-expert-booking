import { Router } from 'express';
import {
  createBookingOrder,
  verifyPayment,
  createPromotion,
  createBookingOrderSchema,
  verifyPaymentSchema,
  createPromotionSchema,
} from '../controllers/paymentController.js';
import validate from '../middleware/validateMiddleware.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
router.use(requireAuth);

router.post('/booking-order', validate(createBookingOrderSchema), createBookingOrder);
router.post('/verify', validate(verifyPaymentSchema), verifyPayment);
router.post('/promotion', validate(createPromotionSchema), createPromotion);

export default router;

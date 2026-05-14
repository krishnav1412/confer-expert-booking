import { Router } from 'express';

import {
  cancelSubscription,
  createSubscription,
  createSubscriptionSchema,
  getMySubscriptions,
  getSubscriptionById,
  pauseSubscription,
  renewSubscription,
  renewSubscriptionSchema,
  resumeSubscription,
  resumeSubscriptionSchema,
  subscriptionReasonSchema,
} from '../controllers/subscriptionController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { writeLimiter } from '../middleware/rateLimitMiddleware.js';
import validate from '../middleware/validateMiddleware.js';

const router = Router();

router.use(requireAuth);

router.post('/', writeLimiter, validate(createSubscriptionSchema), createSubscription);
router.get('/me', getMySubscriptions);
router.get('/:id', getSubscriptionById);
router.post('/:id/pause', writeLimiter, validate(subscriptionReasonSchema), pauseSubscription);
router.post('/:id/resume', writeLimiter, validate(resumeSubscriptionSchema), resumeSubscription);
router.post('/:id/cancel', writeLimiter, validate(subscriptionReasonSchema), cancelSubscription);
router.post('/:id/renew', writeLimiter, validate(renewSubscriptionSchema), renewSubscription);

export default router;

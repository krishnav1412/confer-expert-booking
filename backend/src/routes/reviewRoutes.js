import { Router } from 'express';
import {
  listReviews,
  createReview,
  replyToReview,
  createReviewSchema,
  expertReplySchema,
} from '../controllers/reviewController.js';
import validate from '../middleware/validateMiddleware.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', listReviews);
router.post('/', requireAuth, validate(createReviewSchema), createReview);
router.post('/:id/reply', requireAuth, validate(expertReplySchema), replyToReview);

export default router;

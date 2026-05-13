import { Router } from 'express';
import {
  startConversation,
  listConversations,
  getConversation,
  replyToConversation,
  markRead,
  startConversationSchema,
  replySchema,
} from '../controllers/messageController.js';
import validate from '../middleware/validateMiddleware.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { writeLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();
router.use(requireAuth);

router.get('/conversations', listConversations);
router.get('/conversations/:id', getConversation);
router.post('/conversations', writeLimiter, validate(startConversationSchema), startConversation);
router.post('/conversations/:id/reply', writeLimiter, validate(replySchema), replyToConversation);
router.post('/conversations/:id/read', markRead);

export default router;

import { Router } from 'express';
import {
  listNotifications,
  markAllRead,
  markOneRead,
} from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
router.use(requireAuth);

router.get('/', listNotifications);
router.post('/read-all', markAllRead);
router.post('/:id/read', markOneRead);

export default router;

import { Router } from 'express';
import {
  updateMe,
  changePassword,
  toggleFavorite,
  listFavorites,
  trackView,
  updateProfileSchema,
  changePasswordSchema,
} from '../controllers/userController.js';
import validate from '../middleware/validateMiddleware.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.patch('/me', validate(updateProfileSchema), updateMe);
router.post('/me/change-password', validate(changePasswordSchema), changePassword);
router.get('/me/favorites', listFavorites);
router.post('/me/favorites/:expertId', toggleFavorite);
router.post('/me/recently-viewed/:expertId', trackView);

export default router;

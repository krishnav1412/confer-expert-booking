import { Router } from 'express';
import {
  getExperts,
  getFeaturedExperts,
  getCategories,
  getExpertById,
  getMyExpertProfile,
  updateMyExpertProfile,
  updateMyAvailability,
  getMyAnalytics,
  updateExpertProfileSchema,
  availabilitySchema,
} from '../controllers/expertController.js';
import validate from '../middleware/validateMiddleware.js';
import { requireAuth, requireExpert } from '../middleware/authMiddleware.js';

const router = Router();

// Authenticated expert self-management
router.get('/me', requireAuth, requireExpert, getMyExpertProfile);
router.patch('/me', requireAuth, requireExpert, validate(updateExpertProfileSchema), updateMyExpertProfile);
router.patch('/me/availability', requireAuth, requireExpert, validate(availabilitySchema), updateMyAvailability);
router.get('/me/analytics', requireAuth, requireExpert, getMyAnalytics);

// Public
router.get('/', getExperts);
router.get('/featured', getFeaturedExperts);
router.get('/categories', getCategories);
router.get('/:id', getExpertById);

export default router;

import { Router } from 'express';
import {
  getStats,
  listUsers, getUserDetail, suspendUser, unsuspendUser, deleteUser, suspendUserSchema,
  listExperts, toggleFeaturedExpert, suspendExpert, unsuspendExpert,
  listReviews, deleteReview,
  listBookings,
} from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import validate from '../middleware/validateMiddleware.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/stats', getStats);

// Users
router.get('/users', listUsers);
router.get('/users/:id', getUserDetail);
router.post('/users/:id/suspend', validate(suspendUserSchema), suspendUser);
router.post('/users/:id/unsuspend', unsuspendUser);
router.delete('/users/:id', deleteUser);

// Experts
router.get('/experts', listExperts);
router.post('/experts/:id/toggle-featured', toggleFeaturedExpert);
router.post('/experts/:id/suspend', suspendExpert);
router.post('/experts/:id/unsuspend', unsuspendExpert);

// Reviews
router.get('/reviews', listReviews);
router.delete('/reviews/:id', deleteReview);

// Bookings
router.get('/bookings', listBookings);

export default router;

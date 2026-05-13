import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getExpertBookings,
  updateBookingStatus,
  bookingCreateSchema,
  statusUpdateSchema,
} from '../controllers/bookingController.js';
import validate from '../middleware/validateMiddleware.js';
import { requireAuth, requireExpert } from '../middleware/authMiddleware.js';
import { writeLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();
router.use(requireAuth);

router.get('/me', getMyBookings);
router.get('/expert/me', requireExpert, getExpertBookings);
router.post('/', writeLimiter, validate(bookingCreateSchema), createBooking);
router.patch('/:id/status', validate(statusUpdateSchema), updateBookingStatus);

export default router;

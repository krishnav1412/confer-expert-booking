import { Router } from 'express';
import {
  submitApplication,
  myApplications,
  listAllApplications,
  approveApplication,
  rejectApplication,
  applicationSchema,
} from '../controllers/applicationController.js';
import validate from '../middleware/validateMiddleware.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', requireAuth, validate(applicationSchema), submitApplication);
router.get('/me', requireAuth, myApplications);

// Admin
router.get('/', requireAuth, requireRole('admin'), listAllApplications);
router.post('/:id/approve', requireAuth, requireRole('admin'), approveApplication);
router.post('/:id/reject', requireAuth, requireRole('admin'), rejectApplication);

export default router;

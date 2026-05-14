import { Router } from 'express';

import {
  completeProgramSession,
  completeProgramSessionSchema,
  createProgram,
  createProgramSchema,
  getMyPrograms,
  getProgramById,
  scheduleProgramSession,
  scheduleProgramSessionSchema,
} from '../controllers/programController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { writeLimiter } from '../middleware/rateLimitMiddleware.js';
import validate from '../middleware/validateMiddleware.js';

const router = Router();

router.use(requireAuth);

router.post('/', writeLimiter, validate(createProgramSchema), createProgram);
router.get('/me', getMyPrograms);
router.get('/:id', getProgramById);
router.post('/:id/sessions/:index/schedule', writeLimiter, validate(scheduleProgramSessionSchema), scheduleProgramSession);
router.patch('/:id/sessions/:index/complete', writeLimiter, validate(completeProgramSessionSchema), completeProgramSession);

export default router;

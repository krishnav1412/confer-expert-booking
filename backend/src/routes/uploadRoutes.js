import { Router } from 'express';
import multer from 'multer';
import { uploadAvatar } from '../controllers/uploadController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { writeLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type'));
  },
});

router.post('/avatar', requireAuth, writeLimiter, upload.single('file'), uploadAvatar);

export default router;

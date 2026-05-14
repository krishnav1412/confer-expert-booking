import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'node:path';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import expertRoutes from './routes/expertRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import programRoutes from './routes/programRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import seoRoutes from './routes/seoRoutes.js';

import notFound from './middleware/notFoundMiddleware.js';
import errorHandler from './middleware/errorMiddleware.js';
import { generalLimiter } from './middleware/rateLimitMiddleware.js';
import storageService from './services/storageService.js';

const app = express();

// Behind a load balancer (Render/Railway/Vercel/Cloudflare): trust one hop
app.set('trust proxy', 1);

// Security headers — relaxed CORP for static asset cross-origin loading
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // SPA handles its own CSP via meta tags
  })
);

// CORS — explicit allow-list from CLIENT_URL (comma-separated)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // server-to-server / curl / healthchecks
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// ────────────────────────────────────────────────────────────────────────────
// Webhook routes — MUST come BEFORE express.json() because they use raw body
// for HMAC signature verification.
// ────────────────────────────────────────────────────────────────────────────
app.use('/api/webhooks', webhookRoutes);

// JSON body parser for the rest of the API
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// NoSQL injection protection — strips $ and . from req.body/query/params keys
app.use(mongoSanitize({ replaceWith: '_' }));

// Logging in non-production
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Throttle the whole API
app.use('/api', generalLimiter);

// Serve locally-stored uploads if using the 'local' storage provider
if (storageService.currentProvider() === 'local') {
  app.use(
    storageService.localPublicPrefix(),
    express.static(path.resolve(storageService.localUploadRoot()), {
      maxAge: '7d',
      etag: true,
      fallthrough: false,
    })
  );
}

// SEO at root (not under /api)
app.use('/', seoRoutes);

// Health
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/experts', expertRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

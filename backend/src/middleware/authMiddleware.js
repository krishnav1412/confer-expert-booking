import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

const JWT_SECRET = () => process.env.JWT_SECRET || 'dev-only-change-me';
const JWT_EXPIRES = () => process.env.JWT_EXPIRES_IN || '7d';

export const signToken = (userId) =>
  jwt.sign({ sub: String(userId) }, JWT_SECRET(), { expiresIn: JWT_EXPIRES() });

export const verifyToken = (token) => jwt.verify(token, JWT_SECRET());

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies?.token) return req.cookies.token;
  return null;
};

/**
 * Soft auth — populates req.user if token is valid, but does not reject.
 * Useful for routes that have public + personalised behaviour.
 */
export const optionalAuth = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) return next();
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (user && !user.isSuspended) req.user = user;
    next();
  } catch {
    next();
  }
};

/**
 * Hard auth — requires a valid token.
 */
export const requireAuth = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) throw new ApiError(401, 'Authentication required');
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user) throw new ApiError(401, 'Account not found');
    if (user.isSuspended) throw new ApiError(403, 'Account suspended');
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    if (err.name === 'TokenExpiredError') return next(new ApiError(401, 'Session expired'));
    return next(new ApiError(401, 'Invalid authentication'));
  }
};

/**
 * Require one of the specified roles.
 */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to do that'));
  }
  next();
};

/**
 * Require approved expert.
 */
export const requireExpert = (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  if (req.user.role !== 'expert' || !req.user.isExpertApproved) {
    return next(new ApiError(403, 'Expert access required'));
  }
  if (!req.user.expertProfile) {
    return next(new ApiError(403, 'Expert profile not set up yet'));
  }
  next();
};

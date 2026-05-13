import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Create a notification (called from other controllers).
 * Returns the created doc; never throws so it doesn't break the parent action.
 */
export const createNotification = async ({ userId, type, title, body = '', actionUrl = '', metadata = {} }) => {
  try {
    return await Notification.create({ userId, type, title, body, actionUrl, metadata });
  } catch (err) {
    console.error('[notifications] create failed:', err.message);
    return null;
  }
};

// GET /api/notifications
export const listNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
  const filter = { userId: req.user._id };
  if (req.query.unread === 'true') filter.read = false;

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
    Notification.countDocuments({ userId: req.user._id, read: false }),
  ]);

  res.json({ success: true, data: { notifications, unreadCount } });
});

// POST /api/notifications/read-all
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } });
  res.json({ success: true });
});

// POST /api/notifications/:id/read
export const markOneRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: { read: true } }
  );
  res.json({ success: true });
});

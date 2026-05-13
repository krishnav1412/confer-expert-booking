import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'booking_created',
        'booking_cancelled',
        'booking_completed',
        'message_received',
        'review_received',
        'payment_succeeded',
        'payment_failed',
        'expert_approved',
        'promotion_active',
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    actionUrl: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

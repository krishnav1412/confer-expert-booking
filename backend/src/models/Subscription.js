import mongoose from 'mongoose';

const subscriptionServiceSnapshotSchema = new mongoose.Schema(
  {
    serviceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    name: { type: String, required: true, trim: true },
    price: { type: Number, default: 0, min: 0 },
    durationMinutes: { type: Number, default: 60, min: 15 },
  },
  { _id: false }
);

const pauseHistorySchema = new mongoose.Schema(
  {
    pausedAt: { type: Date, required: true },
    resumedAt: { type: Date, default: null },
    reason: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const renewalHistorySchema = new mongoose.Schema(
  {
    renewedAt: { type: Date, required: true },
    previousRenewalDate: { type: Date, required: true },
    nextRenewalDate: { type: Date, required: true },
    plan: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    autoRenew: { type: Boolean, default: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expert',
      required: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
      index: true,
    },
    serviceSnapshot: {
      type: subscriptionServiceSnapshotSchema,
      required: true,
    },
    recurringDays: {
      type: [{ type: Number, min: 0, max: 6 }],
      required: true,
      validate: {
        validator(days) {
          return Array.isArray(days) && days.length > 0 && new Set(days).size === days.length;
        },
        message: 'At least one unique recurring day is required',
      },
    },
    sessionTime: { type: String, required: true, trim: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    renewalDate: { type: Date, required: true, index: true },
    autoRenew: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled', 'expired', 'past_due'],
      default: 'active',
      index: true,
    },
    generatedBookingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
    pausedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: '', trim: true },
    pauseHistory: { type: [pauseHistorySchema], default: [] },
    renewalHistory: { type: [renewalHistorySchema], default: [] },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    lastRenewedAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

subscriptionSchema.methods.pause = async function pause(reason = '') {
  if (this.status === 'cancelled') throw new Error('Cancelled subscriptions cannot be paused');
  if (this.status === 'paused') return this;

  const pausedAt = new Date();
  this.status = 'paused';
  this.pausedAt = pausedAt;
  this.pauseHistory.push({ pausedAt, reason });
  return this.save();
};

subscriptionSchema.methods.resume = async function resume(nextRenewalDate = null) {
  if (this.status === 'cancelled') throw new Error('Cancelled subscriptions cannot be resumed');
  if (this.status !== 'paused') return this;

  const resumedAt = new Date();
  const lastPause = this.pauseHistory[this.pauseHistory.length - 1];
  if (lastPause && !lastPause.resumedAt) lastPause.resumedAt = resumedAt;

  this.status = 'active';
  this.pausedAt = null;
  if (nextRenewalDate) {
    this.renewalDate = nextRenewalDate;
    this.expiresAt = nextRenewalDate;
  }
  return this.save();
};

subscriptionSchema.methods.cancel = async function cancel(reason = '') {
  if (this.status === 'cancelled') return this;

  this.status = 'cancelled';
  this.autoRenew = false;
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

subscriptionSchema.methods.addGeneratedBooking = async function addGeneratedBooking(bookingId) {
  const exists = this.generatedBookingIds.some((id) => String(id) === String(bookingId));
  if (!exists) this.generatedBookingIds.push(bookingId);
  return this.save();
};

subscriptionSchema.methods.renew = async function renew(nextRenewalDate = null, metadata = {}) {
  if (this.status === 'cancelled') throw new Error('Cancelled subscriptions cannot be renewed');

  const renewedAt = new Date();
  const previousRenewalDate = this.renewalDate || renewedAt;
  const nextDate = nextRenewalDate || calculateNextRenewalDate(previousRenewalDate, this.plan);
  const lastPause = this.pauseHistory[this.pauseHistory.length - 1];
  if (this.status === 'paused' && lastPause && !lastPause.resumedAt) {
    lastPause.resumedAt = renewedAt;
  }

  this.status = 'active';
  this.pausedAt = null;
  this.lastRenewedAt = renewedAt;
  this.renewalDate = nextDate;
  this.expiresAt = nextDate;
  this.renewalHistory.push({
    renewedAt,
    previousRenewalDate,
    nextRenewalDate: nextDate,
    plan: this.plan,
    autoRenew: this.autoRenew,
    metadata,
  });

  return this.save();
};

const calculateNextRenewalDate = (fromDate, plan) => {
  const next = new Date(fromDate);
  if (plan === 'yearly') next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next;
};

subscriptionSchema.index({ userId: 1, status: 1, renewalDate: 1 });
subscriptionSchema.index({ expertId: 1, status: 1, renewalDate: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;

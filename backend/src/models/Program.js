import mongoose from 'mongoose';

const programPackageSnapshotSchema = new mongoose.Schema(
  {
    serviceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    price: { type: Number, default: 0, min: 0 },
    durationMinutes: { type: Number, default: 60, min: 15 },
  },
  { _id: false }
);

const programMilestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    sessionNumber: { type: Number, required: true, min: 1 },
    completedAt: { type: Date, default: null },
  },
  { _id: true }
);

const programProgressSchema = new mongoose.Schema(
  {
    completedSessions: { type: Number, default: 0, min: 0 },
    bookedSessions: { type: Number, default: 0, min: 0 },
    percent: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false }
);

const programSchema = new mongoose.Schema(
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
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    packageSnapshot: {
      type: programPackageSnapshotSchema,
      required: true,
    },
    totalSessions: { type: Number, required: true, min: 1 },
    progress: {
      type: programProgressSchema,
      default: () => ({}),
    },
    bookingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
    milestones: { type: [programMilestoneSchema], default: [] },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

programSchema.pre('validate', function syncProgress(next) {
  const total = Math.max(this.totalSessions || 0, 1);
  const completed = Math.min(this.progress?.completedSessions || 0, total);
  const booked = Math.min(this.bookingIds?.length || this.progress?.bookedSessions || 0, total);

  this.progress = {
    completedSessions: completed,
    bookedSessions: booked,
    percent: Math.round((completed / total) * 100),
  };

  if (completed >= total && this.status !== 'cancelled') {
    this.status = 'completed';
    this.completedAt = this.completedAt || new Date();
  }

  next();
});

programSchema.methods.addBooking = async function addBooking(bookingId) {
  const exists = this.bookingIds.some((id) => String(id) === String(bookingId));
  if (!exists) this.bookingIds.push(bookingId);
  return this.save();
};

programSchema.methods.markSessionCompleted = async function markSessionCompleted(count = 1) {
  const nextCompleted = (this.progress?.completedSessions || 0) + count;
  this.progress.completedSessions = Math.min(nextCompleted, this.totalSessions);
  return this.save();
};

programSchema.index({ userId: 1, status: 1, createdAt: -1 });
programSchema.index({ expertId: 1, status: 1, createdAt: -1 });

const Program = mongoose.model('Program', programSchema);
export default Program;

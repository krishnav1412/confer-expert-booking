import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
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
    // Snapshots — stable even if user/expert later edits profile
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, default: '', trim: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    timeSlot: { type: String, required: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    notes: { type: String, default: '', trim: true },

    // Service snapshot
    serviceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    serviceName: { type: String, default: 'Session' },
    servicePrice: { type: Number, default: 0 },
    serviceDuration: { type: Number, default: 60 },

    // Booking lifecycle
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending',
    },

    // Payment lifecycle
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },

    cancelledAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },

    // Video session foundation
    meetingProvider: {
      type: String,
      enum: ['none', 'jitsi', 'google_meet', 'zoom', 'custom'],
      default: 'none',
    },
    meetingUrl: { type: String, default: '' },
    meetingId: { type: String, default: '' },

    // Reschedule history (preserves the past slot snapshot)
    rescheduledFrom: {
      date: { type: String, default: null },
      timeSlot: { type: String, default: null },
      at: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// Database-level guarantee against double booking
bookingSchema.index(
  { expertId: 1, date: 1, timeSlot: 1 },
  {
    unique: true,
    name: 'unique_slot_per_expert',
    partialFilterExpression: { status: { $ne: 'Cancelled' } },
  }
);

// Hot-path indexes
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ expertId: 1, status: 1, date: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;

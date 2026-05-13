import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
  {
    expertUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const reviewSchema = new mongoose.Schema(
  {
    expertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expert',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Optional only for legacy/seeded reviews — new reviews always set this
      default: null,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    reviewerName: { type: String, required: true, trim: true },
    reviewerRole: { type: String, default: '', trim: true },
    reviewerCompany: { type: String, default: '', trim: true },
    reviewerImage: { type: String, default: '' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, trim: true, minlength: 10, maxlength: 1500 },
    verified: { type: Boolean, default: false }, // true when tied to a Completed booking
    expertReply: { type: replySchema, default: null },
  },
  { timestamps: true }
);

// One review per (user, booking)
reviewSchema.index(
  { userId: 1, bookingId: 1 },
  { unique: true, partialFilterExpression: { userId: { $type: 'objectId' }, bookingId: { $type: 'objectId' } } }
);

const Review = mongoose.model('Review', reviewSchema);
export default Review;

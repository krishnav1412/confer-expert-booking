import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema(
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
      required: true,
    },
    plan: {
      type: String,
      enum: ['weekly', 'monthly'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    status: {
      type: String,
      enum: ['pending', 'active', 'expired', 'cancelled', 'failed'],
      default: 'pending',
      index: true,
    },
    startsAt: { type: Date, default: Date.now },
    endsAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

promotionSchema.statics.isExpertCurrentlyPromoted = async function isPromoted(expertId) {
  const now = new Date();
  return this.exists({ expertId, status: 'active', startsAt: { $lte: now }, endsAt: { $gte: now } });
};

const Promotion = mongoose.model('Promotion', promotionSchema);
export default Promotion;

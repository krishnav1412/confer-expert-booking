import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['booking', 'promotion'],
      required: true,
    },
    referenceId: {
      // Either Booking._id or Promotion._id
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 }, // INR rupees
    currency: { type: String, default: 'INR' },
    provider: { type: String, enum: ['razorpay', 'mock'], default: 'mock' },
    providerOrderId: { type: String, default: '' },
    providerPaymentId: { type: String, default: '' },
    providerSignature: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;

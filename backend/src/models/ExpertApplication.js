import mongoose from 'mongoose';

const proposedServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, required: true, min: 15 },
  },
  { _id: false }
);

const expertApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, default: '', trim: true },
    category: { type: String, required: true, trim: true },
    experienceYears: { type: Number, required: true, min: 0 },
    currentCompany: { type: String, default: '', trim: true },
    linkedinUrl: { type: String, default: '', trim: true },
    websiteUrl: { type: String, default: '', trim: true },
    bio: { type: String, required: true, trim: true, minlength: 50, maxlength: 1000 },
    services: { type: [proposedServiceSchema], default: [] },
    availability: { type: String, default: '', trim: true },
    motivation: { type: String, required: true, trim: true, minlength: 30, maxlength: 1000 },
    status: {
      type: String,
      enum: ['Under Review', 'Approved', 'Rejected'],
      default: 'Under Review',
      index: true,
    },
    reviewedAt: { type: Date, default: null },
    reviewerNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

const ExpertApplication = mongoose.model('ExpertApplication', expertApplicationSchema);
export default ExpertApplication;

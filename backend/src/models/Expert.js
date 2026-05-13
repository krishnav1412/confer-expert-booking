import mongoose from 'mongoose';

const slotGroupSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    slots: { type: [String], default: [] },
  },
  { _id: false }
);

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    price: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, required: true, min: 15 },
    active: { type: Boolean, default: true },
  },
  { _id: true }
);

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const statsSchema = new mongoose.Schema(
  {
    sessionsCompleted: { type: Number, default: 0 },
    repeatClientsPercent: { type: Number, default: 0, min: 0, max: 100 },
    responseTimeHours: { type: Number, default: 24, min: 0 },
    profileViews: { type: Number, default: 0 },
  },
  { _id: false }
);

// Per-day-of-week recurring availability template (0 = Sunday)
const weeklyTemplateSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    enabled: { type: Boolean, default: true },
    slots: { type: [String], default: [] }, // e.g. ['09:00 AM', '10:00 AM']
  },
  { _id: false }
);

const expertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: [
        'Career Mentor',
        'Fitness Coach',
        'Startup Advisor',
        'UI/UX Expert',
        'AI Consultant',
        'Software Engineer',
        'Product Manager',
        'Data Scientist',
        'Marketing Expert',
      ],
      index: true,
    },
    company: { type: String, default: '', trim: true },
    experience: { type: Number, required: true, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    bio: { type: String, required: true, trim: true },
    profileImage: { type: String, default: '' },
    skills: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 }, // legacy: lowest service price
    services: { type: [serviceSchema], default: [] },
    deliverables: { type: [String], default: [] },
    faqs: { type: [faqSchema], default: [] },
    stats: { type: statsSchema, default: () => ({}) },
    badges: { type: [String], default: [] },
    featured: { type: Boolean, default: false, index: true },
    promoted: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false, index: true },
    promotionEndsAt: { type: Date, default: null },
    linkedinUrl: { type: String, default: '' },
    websiteUrl: { type: String, default: '' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    availableSlots: { type: [slotGroupSchema], default: [] },
    weeklyTemplate: { type: [weeklyTemplateSchema], default: [] },
    blockedDates: { type: [String], default: [] }, // ['YYYY-MM-DD']
    bookingBufferHours: { type: Number, default: 12, min: 0 },
    maxBookingsPerDay: { type: Number, default: 8, min: 1 },
  },
  { timestamps: true }
);

expertSchema.index({ name: 'text', bio: 'text', skills: 'text', company: 'text' });
expertSchema.index({ featured: -1, rating: -1 });

const Expert = mongoose.model('Expert', expertSchema);
export default Expert;

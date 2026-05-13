import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const notificationPrefSchema = new mongoose.Schema(
  {
    bookingEmail: { type: Boolean, default: true },
    messageEmail: { type: Boolean, default: true },
    marketingEmail: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 500 },
    timezone: { type: String, default: 'Asia/Kolkata' },
    phone: { type: String, default: '', trim: true },
    socialLinks: {
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    role: {
      type: String,
      enum: ['user', 'expert', 'admin'],
      default: 'user',
      index: true,
    },
    isExpertApproved: { type: Boolean, default: false },
    expertProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Expert', default: null },
    notificationPrefs: { type: notificationPrefSchema, default: () => ({}) },
    favoriteExperts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expert' }],
    recentlyViewed: [
      {
        expertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expert' },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String, default: '' },
    suspendedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    // Password reset
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpiresAt: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

userSchema.methods.verifyPassword = async function verify(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toPublicJSON = function toPublic() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetTokenHash;
  delete obj.passwordResetExpiresAt;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;

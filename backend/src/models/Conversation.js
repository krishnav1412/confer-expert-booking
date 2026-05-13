import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ['user', 'expert'], required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    readByExpert: { type: Boolean, default: false },
    readByUser: { type: Boolean, default: true },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expert', required: true, index: true },
    expertUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Snapshot at thread start for display
    userName: { type: String, required: true, trim: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, default: '', trim: true },
    messages: { type: [messageSchema], default: [] },
    lastMessageAt: { type: Date, default: Date.now, index: -1 },
  },
  { timestamps: true }
);

conversationSchema.index({ userId: 1, expertId: 1 }, { unique: true });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;

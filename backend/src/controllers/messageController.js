import { z } from 'zod';
import Conversation from '../models/Conversation.js';
import Expert from '../models/Expert.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { createNotification } from './notificationController.js';

export const startConversationSchema = z.object({
  expertId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid expert id'),
  subject: z.string().trim().max(120).optional().default(''),
  message: z.string().trim().min(2).max(2000),
});

export const replySchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

// POST /api/messages/conversations
export const startConversation = asyncHandler(async (req, res) => {
  const { expertId, subject, message } = req.body;
  const expert = await Expert.findById(expertId).select('_id userId name');
  if (!expert) throw new ApiError(404, 'Expert not found');

  if (String(expert.userId) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot message yourself');
  }

  let convo = await Conversation.findOne({ userId: req.user._id, expertId });
  const newMsg = {
    sender: 'user',
    senderId: req.user._id,
    text: message,
    readByExpert: false,
    readByUser: true,
  };

  if (!convo) {
    convo = await Conversation.create({
      userId: req.user._id,
      expertId,
      expertUserId: expert.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      subject,
      messages: [newMsg],
      lastMessageAt: new Date(),
    });
  } else {
    convo.messages.push(newMsg);
    if (subject && !convo.subject) convo.subject = subject;
    convo.lastMessageAt = new Date();
    await convo.save();
  }

  // Notify expert
  await createNotification({
    userId: expert.userId,
    type: 'message_received',
    title: `New message from ${req.user.name}`,
    body: message.slice(0, 120),
    actionUrl: '/messages',
    metadata: { conversationId: String(convo._id) },
  });

  res.status(201).json({ success: true, data: convo, message: 'Message sent' });
});

// GET /api/messages/conversations  (auto-scopes to current user, role-aware)
export const listConversations = asyncHandler(async (req, res) => {
  const role = req.query.role === 'expert' ? 'expert' : 'user';

  let filter;
  if (role === 'expert') {
    if (req.user.role !== 'expert') throw new ApiError(403, 'Expert access required');
    filter = { expertUserId: req.user._id };
  } else {
    filter = { userId: req.user._id };
  }

  const conversations = await Conversation.find(filter)
    .populate('expertId', 'name profileImage category company')
    .sort({ lastMessageAt: -1 })
    .lean();

  const enriched = conversations.map((c) => ({
    ...c,
    unreadByUser: (c.messages || []).filter((m) => m.sender === 'expert' && !m.readByUser).length,
    unreadByExpert: (c.messages || []).filter((m) => m.sender === 'user' && !m.readByExpert).length,
    lastMessage: (c.messages || []).slice(-1)[0] || null,
    role,
  }));

  res.json({ success: true, data: enriched });
});

// GET /api/messages/conversations/:id
export const getConversation = asyncHandler(async (req, res) => {
  const convo = await Conversation.findById(req.params.id)
    .populate('expertId', 'name profileImage category company')
    .lean();
  if (!convo) throw new ApiError(404, 'Conversation not found');

  // Ownership: must be the user OR the expert
  const isUser = String(convo.userId) === String(req.user._id);
  const isExpert = String(convo.expertUserId) === String(req.user._id);
  if (!isUser && !isExpert) throw new ApiError(403, 'You are not a participant in this conversation');

  res.json({ success: true, data: { ...convo, role: isExpert ? 'expert' : 'user' } });
});

// POST /api/messages/conversations/:id/reply
export const replyToConversation = asyncHandler(async (req, res) => {
  const convo = await Conversation.findById(req.params.id);
  if (!convo) throw new ApiError(404, 'Conversation not found');

  const isUser = String(convo.userId) === String(req.user._id);
  const isExpert = String(convo.expertUserId) === String(req.user._id);
  if (!isUser && !isExpert) throw new ApiError(403, 'You are not a participant');

  const sender = isExpert ? 'expert' : 'user';
  convo.messages.push({
    sender,
    senderId: req.user._id,
    text: req.body.text,
    readByExpert: sender === 'expert',
    readByUser: sender === 'user',
  });
  convo.lastMessageAt = new Date();
  await convo.save();

  // Notify counterparty
  const targetUserId = isExpert ? convo.userId : convo.expertUserId;
  await createNotification({
    userId: targetUserId,
    type: 'message_received',
    title: `New reply from ${req.user.name}`,
    body: req.body.text.slice(0, 120),
    actionUrl: '/messages',
    metadata: { conversationId: String(convo._id) },
  });

  res.json({ success: true, data: convo, message: 'Reply sent' });
});

// POST /api/messages/conversations/:id/read
export const markRead = asyncHandler(async (req, res) => {
  const convo = await Conversation.findById(req.params.id);
  if (!convo) throw new ApiError(404, 'Conversation not found');

  const isUser = String(convo.userId) === String(req.user._id);
  const isExpert = String(convo.expertUserId) === String(req.user._id);
  if (!isUser && !isExpert) throw new ApiError(403, 'You are not a participant');

  convo.messages.forEach((m) => {
    if (isUser && m.sender === 'expert') m.readByUser = true;
    if (isExpert && m.sender === 'user') m.readByExpert = true;
  });
  await convo.save();
  res.json({ success: true, data: convo });
});

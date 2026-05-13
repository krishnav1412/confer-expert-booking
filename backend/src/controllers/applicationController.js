import { z } from 'zod';
import ExpertApplication from '../models/ExpertApplication.js';
import User from '../models/User.js';
import Expert from '../models/Expert.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { createNotification } from './notificationController.js';
import emailService from '../services/emailService.js';

export const applicationSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{7,20}$/).optional().or(z.literal('')),
  category: z.string().trim().min(2),
  experienceYears: z.coerce.number().min(0).max(60),
  currentCompany: z.string().trim().max(120).optional().or(z.literal('')),
  linkedinUrl: z.string().trim().url().optional().or(z.literal('')),
  websiteUrl: z.string().trim().url().optional().or(z.literal('')),
  bio: z.string().trim().min(50).max(1000),
  services: z.array(z.object({
    name: z.string().trim().min(2),
    price: z.coerce.number().min(0),
    durationMinutes: z.coerce.number().min(15),
  })).optional().default([]),
  availability: z.string().trim().max(500).optional().or(z.literal('')),
  motivation: z.string().trim().min(30).max(1000),
});

// POST /api/applications  (auth required)
export const submitApplication = asyncHandler(async (req, res) => {
  if (req.user.role === 'expert' && req.user.isExpertApproved) {
    throw new ApiError(400, 'You are already an approved expert');
  }
  // Check for an existing pending application
  const existing = await ExpertApplication.findOne({
    userId: req.user._id,
    status: 'Under Review',
  });
  if (existing) throw new ApiError(409, 'You already have an application under review');

  const app = await ExpertApplication.create({
    ...req.body,
    userId: req.user._id,
    email: req.user.email,
  });

  res.status(201).json({
    success: true,
    data: { id: app._id, status: app.status },
    message: 'Application submitted',
  });
});

// GET /api/applications/me
export const myApplications = asyncHandler(async (req, res) => {
  const apps = await ExpertApplication.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: apps });
});

// ----- Admin only -----

// GET /api/applications  (admin)
export const listAllApplications = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const apps = await ExpertApplication.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: apps });
});

// POST /api/applications/:id/approve  (admin)
export const approveApplication = asyncHandler(async (req, res) => {
  const app = await ExpertApplication.findById(req.params.id);
  if (!app) throw new ApiError(404, 'Application not found');
  if (app.status !== 'Under Review') throw new ApiError(400, 'Application is not pending');

  const user = await User.findById(app.userId);
  if (!user) throw new ApiError(404, 'Applicant account not found');

  // Build a minimal expert profile
  let expert = await Expert.findOne({ userId: user._id });
  if (!expert) {
    expert = await Expert.create({
      userId: user._id,
      name: app.fullName,
      category: app.category,
      company: app.currentCompany || '',
      experience: app.experienceYears,
      bio: app.bio,
      profileImage: user.avatar || '',
      linkedinUrl: app.linkedinUrl || '',
      websiteUrl: app.websiteUrl || '',
      services: app.services.map((s) => ({ ...s, description: '' })),
      price: app.services.length > 0 ? Math.min(...app.services.map((s) => s.price)) : 0,
      stats: { sessionsCompleted: 0, repeatClientsPercent: 0, responseTimeHours: 24 },
    });
  }

  user.role = 'expert';
  user.isExpertApproved = true;
  user.expertProfile = expert._id;
  await user.save();

  app.status = 'Approved';
  app.reviewedAt = new Date();
  await app.save();

  await createNotification({
    userId: user._id,
    type: 'expert_approved',
    title: 'Your expert application was approved',
    body: 'Your profile is live on Confer. Welcome aboard.',
    actionUrl: '/expert-dashboard',
  });

  emailService.sendExpertApprovedEmail(user);

  res.json({ success: true, data: { application: app, expertId: expert._id } });
});

// POST /api/applications/:id/reject  (admin)
export const rejectApplication = asyncHandler(async (req, res) => {
  const app = await ExpertApplication.findById(req.params.id);
  if (!app) throw new ApiError(404, 'Application not found');
  app.status = 'Rejected';
  app.reviewedAt = new Date();
  app.reviewerNotes = req.body?.notes || '';
  await app.save();

  const user = await User.findById(app.userId);
  if (user) {
    emailService.sendExpertRejectedEmail(user, app.reviewerNotes);
    await createNotification({
      userId: user._id,
      type: 'expert_approved', // reuse type
      title: 'Update on your expert application',
      body: app.reviewerNotes || 'Your application was not approved at this time.',
      actionUrl: '/become-expert',
    });
  }

  res.json({ success: true, data: app });
});

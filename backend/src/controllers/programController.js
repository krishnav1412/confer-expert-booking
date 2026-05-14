import { z } from 'zod';

import Booking from '../models/Booking.js';
import Expert from '../models/Expert.js';
import Program from '../models/Program.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { createBookingForUser, resolveServiceSnapshot } from './bookingController.js';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const createProgramSchema = z.object({
  expertId: objectIdSchema,
  serviceId: objectIdSchema.optional(),
  title: z.string().trim().min(2).max(140).optional(),
  description: z.string().trim().max(1000).optional().default(''),
  totalSessions: z.coerce.number().int().min(1).max(100),
});

export const scheduleProgramSessionSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, 'Enter a valid phone number'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  timeSlot: z.string().trim().min(1, 'Time slot is required'),
  notes: z.string().max(500).optional().default(''),
  timezone: z.string().trim().max(80).optional(),
});

export const completeProgramSessionSchema = z.object({}).optional().default({});

// POST /api/programs
export const createProgram = asyncHandler(async (req, res) => {
  const { expertId, serviceId, totalSessions, description } = req.body;

  const expert = await Expert.findById(expertId);
  if (!expert) throw new ApiError(404, 'Expert not found');
  if (String(expert.userId) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot enroll in your own program');
  }

  const service = resolveServiceSnapshot(expert, serviceId);
  const title = req.body.title || `${service.serviceName} Program`;

  const program = await Program.create({
    userId: req.user._id,
    expertId: expert._id,
    title,
    description,
    packageSnapshot: {
      serviceId: service.serviceId,
      name: service.serviceName,
      description: service.serviceDescription,
      price: service.servicePrice,
      durationMinutes: service.serviceDuration,
    },
    totalSessions,
    milestones: Array.from({ length: totalSessions }, (_, index) => ({
      title: `Session ${index + 1}`,
      sessionNumber: index + 1,
    })),
  });

  res.status(201).json({
    success: true,
    data: program,
    message: 'Program created successfully',
  });
});

// GET /api/programs/me
export const getMyPrograms = asyncHandler(async (req, res) => {
  const ownedExpert = await Expert.findOne({ userId: req.user._id }).select('_id').lean();
  const filter = ownedExpert
    ? { $or: [{ userId: req.user._id }, { expertId: ownedExpert._id }] }
    : { userId: req.user._id };

  const programs = await populateProgramQuery(
    Program.find(filter).sort({ createdAt: -1 })
  ).lean();

  res.json({ success: true, data: programs });
});

// GET /api/programs/:id
export const getProgramById = asyncHandler(async (req, res) => {
  await assertCanViewProgram(req.params.id, req.user);
  const program = await findProgramDetail(req.params.id);
  res.json({ success: true, data: program });
});

// POST /api/programs/:id/sessions/:index/schedule
export const scheduleProgramSession = asyncHandler(async (req, res) => {
  const { program, isClient } = await getProgramAccess(req.params.id, req.user);
  if (!isClient) throw new ApiError(403, 'Only the enrolled user can schedule program sessions');
  if (program.status !== 'active') throw new ApiError(400, 'Only active programs can be scheduled');

  const sessionIndex = parseSessionIndex(req.params.index, program.totalSessions);
  const existing = await Booking.findOne({
    programId: program._id,
    sequenceNumber: sessionIndex,
    status: { $ne: 'Cancelled' },
  });
  if (existing) throw new ApiError(409, 'This program session is already scheduled');

  const booking = await createBookingForUser({
    user: req.user,
    payload: {
      expertId: String(program.expertId),
      serviceId: program.packageSnapshot.serviceId ? String(program.packageSnapshot.serviceId) : undefined,
      ...req.body,
    },
    bookingMeta: {
      bookingType: 'program',
      programId: program._id,
      sequenceNumber: sessionIndex,
    },
    serviceSnapshotOverride: {
      serviceId: program.packageSnapshot.serviceId,
      serviceName: program.packageSnapshot.name,
      servicePrice: program.packageSnapshot.price,
      serviceDuration: program.packageSnapshot.durationMinutes,
    },
  });

  await program.addBooking(booking._id);
  const updatedProgram = await findProgramDetail(program._id);

  res.status(201).json({
    success: true,
    data: { program: updatedProgram, booking },
    message: 'Program session scheduled',
  });
});

// PATCH /api/programs/:id/sessions/:index/complete
export const completeProgramSession = asyncHandler(async (req, res) => {
  const { program, isExpert, isAdmin } = await getProgramAccess(req.params.id, req.user);
  if (!isExpert && !isAdmin) {
    throw new ApiError(403, 'Only the expert or an admin can complete program sessions');
  }

  const sessionIndex = parseSessionIndex(req.params.index, program.totalSessions);
  const booking = await Booking.findOne({
    programId: program._id,
    sequenceNumber: sessionIndex,
    status: { $ne: 'Cancelled' },
  });
  if (!booking) throw new ApiError(404, 'Scheduled program session not found');

  if (booking.status !== 'Completed') {
    booking.status = 'Completed';
    booking.completedAt = new Date();
    await booking.save();
  }

  const completedSessions = await Booking.countDocuments({
    programId: program._id,
    status: 'Completed',
  });
  program.progress.completedSessions = Math.min(completedSessions, program.totalSessions);

  const milestone = program.milestones.find((item) => item.sessionNumber === sessionIndex);
  if (milestone && !milestone.completedAt) {
    milestone.completedAt = booking.completedAt || new Date();
  }
  await program.save();

  const updatedProgram = await findProgramDetail(program._id);

  res.json({
    success: true,
    data: { program: updatedProgram, booking },
    message: 'Program session completed',
  });
});

const populateProgramQuery = (query) =>
  query
    .populate('expertId', 'name category profileImage company')
    .populate('userId', 'name email avatar')
    .populate({
      path: 'bookingIds',
      select: 'date timeSlot status paymentStatus serviceName servicePrice serviceDuration bookingType sequenceNumber createdAt',
      options: { sort: { sequenceNumber: 1, date: 1 } },
    });

const findProgramDetail = (id) => populateProgramQuery(Program.findById(id)).lean();

const assertCanViewProgram = async (programId, user) => {
  const access = await getProgramAccess(programId, user);
  if (!access.isClient && !access.isExpert && !access.isAdmin) {
    throw new ApiError(403, 'You cannot access this program');
  }
};

const getProgramAccess = async (programId, user) => {
  const program = await Program.findById(programId);
  if (!program) throw new ApiError(404, 'Program not found');

  const isClient = String(program.userId) === String(user._id);
  const expert = await Expert.findById(program.expertId).select('userId');
  const isExpert = expert && String(expert.userId) === String(user._id);
  const isAdmin = user.role === 'admin';

  return { program, isClient, isExpert, isAdmin };
};

const parseSessionIndex = (value, totalSessions) => {
  const index = Number.parseInt(value, 10);
  if (!Number.isInteger(index) || String(index) !== String(value) || index < 1) {
    throw new ApiError(400, 'Session index must be a positive integer');
  }
  if (index > totalSessions) {
    throw new ApiError(400, 'Session index is outside this program');
  }
  return index;
};

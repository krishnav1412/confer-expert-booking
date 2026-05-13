import { z } from 'zod';
import Booking from '../models/Booking.js';
import Expert from '../models/Expert.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { emitSlotBooked } from '../socket/socket.js';
import { createNotification } from './notificationController.js';
import emailService from '../services/emailService.js';

export const bookingCreateSchema = z.object({
  expertId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid expert id'),
  serviceId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, 'Enter a valid phone number'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  timeSlot: z.string().trim().min(1, 'Time slot is required'),
  notes: z.string().max(500).optional().default(''),
  timezone: z.string().trim().max(80).optional(),
});

export const statusUpdateSchema = z.object({
  status: z.enum(['Pending', 'Confirmed', 'Completed', 'Cancelled']),
});

// POST /api/bookings (auth required)
export const createBooking = asyncHandler(async (req, res) => {
  const { expertId, serviceId, phone, date, timeSlot, notes, timezone } = req.body;

  const expert = await Expert.findById(expertId);
  if (!expert) throw new ApiError(404, 'Expert not found');

  // Cannot book yourself
  if (String(expert.userId) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot book your own profile');
  }

  // Verify slot is in availability and not blocked
  const dayGroup = expert.availableSlots.find((g) => g.date === date);
  if (!dayGroup || !dayGroup.slots.includes(timeSlot)) {
    throw new ApiError(400, 'Selected time slot is not available');
  }
  if (expert.blockedDates?.includes(date)) {
    throw new ApiError(400, 'This date is blocked by the expert');
  }

  // Buffer check
  const slotStart = parseSlotToDate(date, timeSlot, expert.timezone || 'Asia/Kolkata');
  const bufferMs = (expert.bookingBufferHours || 0) * 3600 * 1000;
  if (slotStart && slotStart.getTime() - Date.now() < bufferMs) {
    throw new ApiError(400, 'This slot is within the expert\'s booking buffer window');
  }

  // Resolve service snapshot
  let serviceName = 'Session';
  let servicePrice = expert.price;
  let serviceDuration = 60;
  let resolvedServiceId = null;
  if (serviceId && expert.services?.length) {
    const service = expert.services.id(serviceId);
    if (!service || service.active === false) throw new ApiError(400, 'Selected service not available');
    resolvedServiceId = service._id;
    serviceName = service.name;
    servicePrice = service.price;
    serviceDuration = service.durationMinutes;
  } else if (expert.services?.length) {
    const cheapest = [...expert.services].filter((s) => s.active !== false).sort((a, b) => a.price - b.price)[0];
    if (cheapest) {
      resolvedServiceId = cheapest._id;
      serviceName = cheapest.name;
      servicePrice = cheapest.price;
      serviceDuration = cheapest.durationMinutes;
    }
  }

  // Pre-check concurrent collision
  const existing = await Booking.findOne({ expertId, date, timeSlot, status: { $ne: 'Cancelled' } });
  if (existing) throw new ApiError(409, 'Slot already booked');

  let booking;
  try {
    booking = await Booking.create({
      userId: req.user._id,
      expertId,
      name: req.user.name,
      email: req.user.email,
      phone,
      date,
      timeSlot,
      timezone: timezone || req.user.timezone || 'Asia/Kolkata',
      notes,
      serviceId: resolvedServiceId,
      serviceName,
      servicePrice,
      serviceDuration,
      status: 'Confirmed',
      paymentStatus: servicePrice > 0 ? 'pending' : 'paid', // 0-cost goes through
    });
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, 'Slot already booked');
    throw err;
  }

  // Real-time broadcast
  emitSlotBooked(expertId, {
    expertId: String(expertId),
    date,
    timeSlot,
    bookingId: String(booking._id),
  });

  // Notifications
  await createNotification({
    userId: req.user._id,
    type: 'booking_created',
    title: `Session booked with ${expert.name}`,
    body: `${serviceName} on ${date} at ${timeSlot}`,
    actionUrl: '/dashboard',
    metadata: { bookingId: String(booking._id) },
  });
  await createNotification({
    userId: expert.userId,
    type: 'booking_created',
    title: `New booking from ${req.user.name}`,
    body: `${serviceName} on ${date} at ${timeSlot}`,
    actionUrl: '/expert-dashboard',
    metadata: { bookingId: String(booking._id) },
  });

  // Fire-and-forget transactional email
  emailService.sendBookingConfirmedEmail(req.user, booking);

  res.status(201).json({
    success: true,
    data: booking,
    message: 'Booking created successfully',
  });
});

// GET /api/bookings/me  (current user's bookings)
export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ userId: req.user._id })
    .populate('expertId', 'name category profileImage company')
    .sort({ date: -1, createdAt: -1 })
    .lean();
  res.json({ success: true, data: bookings });
});

// GET /api/bookings/expert/me  (current expert's bookings)
export const getExpertBookings = asyncHandler(async (req, res) => {
  const expert = await Expert.findOne({ userId: req.user._id }).select('_id');
  if (!expert) throw new ApiError(404, 'No expert profile');

  const bookings = await Booking.find({ expertId: expert._id })
    .populate('userId', 'name email avatar')
    .sort({ date: -1, createdAt: -1 })
    .lean();
  res.json({ success: true, data: bookings });
});

// PATCH /api/bookings/:id/status
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');

  // Only the booking owner OR the expert who owns the profile can change status
  const expert = await Expert.findById(booking.expertId).select('userId');
  const isOwner = String(booking.userId) === String(req.user._id);
  const isExpert = expert && String(expert.userId) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isExpert && !isAdmin) {
    throw new ApiError(403, 'You cannot modify this booking');
  }

  // Users can cancel; experts can confirm / complete / cancel
  if (isOwner && !isExpert && !isAdmin && status !== 'Cancelled') {
    throw new ApiError(403, 'Only the expert can confirm or complete a booking');
  }

  booking.status = status;
  if (status === 'Cancelled') booking.cancelledAt = new Date();
  if (status === 'Completed') booking.completedAt = new Date();
  await booking.save();

  // Notify both parties
  const targets = new Set([String(booking.userId), String(expert?.userId)]);
  targets.delete(String(req.user._id));
  for (const uid of targets) {
    if (!uid) continue;
    await createNotification({
      userId: uid,
      type: status === 'Cancelled' ? 'booking_cancelled' : status === 'Completed' ? 'booking_completed' : 'booking_created',
      title: `Booking ${status.toLowerCase()}`,
      body: `${booking.serviceName} on ${booking.date} at ${booking.timeSlot}`,
      actionUrl: isOwner ? '/expert-dashboard' : '/dashboard',
      metadata: { bookingId: String(booking._id) },
    });
  }

  res.json({ success: true, data: booking, message: 'Booking status updated' });
});

// Helper: parse 'YYYY-MM-DD' + 'hh:mm AM/PM' to a Date assuming Asia/Kolkata (+05:30)
function parseSlotToDate(date, timeSlot, _tz) {
  try {
    const [time, period] = timeSlot.split(' ');
    let [h, m] = time.split(':').map((s) => parseInt(s, 10));
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    // Treat as IST (+05:30) for sanity in dev
    const utcMillis = Date.UTC(
      parseInt(date.slice(0, 4), 10),
      parseInt(date.slice(5, 7), 10) - 1,
      parseInt(date.slice(8, 10), 10),
      h - 5,
      m - 30
    );
    return new Date(utcMillis);
  } catch {
    return null;
  }
}

import cron from 'node-cron';

import Booking from '../models/Booking.js';
import Subscription from '../models/Subscription.js';
import { createBookingForUser } from '../controllers/bookingController.js';
import emailService from './emailService.js';

const DEFAULT_TIMEZONE = process.env.SCHEDULER_TIMEZONE || 'Asia/Kolkata';
const GENERATION_DAYS = Math.min(
  Math.max(parseInt(process.env.SUBSCRIPTION_BOOKING_GENERATION_DAYS || '14', 10), 1),
  90
);

const tasks = [];

export const startSubscriptionScheduler = () => {
  if (process.env.NODE_ENV === 'test' || process.env.SUBSCRIPTION_SCHEDULER_ENABLED === 'false') {
    return { stop: () => {} };
  }

  scheduleJob(
    process.env.SUBSCRIPTION_GENERATION_CRON || '5 0 * * *',
    'subscription booking generation',
    generateRecurringSubscriptionBookings
  );
  scheduleJob(
    process.env.BOOKING_REMINDER_CRON || '*/30 * * * *',
    'booking reminders',
    sendUpcomingBookingReminders
  );
  scheduleJob(
    process.env.SUBSCRIPTION_EXPIRY_CRON || '15 0 * * *',
    'subscription expiry',
    expireNonRenewingSubscriptions
  );

  console.log('[scheduler] Subscription scheduler started');

  return {
    stop() {
      tasks.splice(0).forEach((task) => task.stop());
      console.log('[scheduler] Subscription scheduler stopped');
    },
  };
};

export const generateRecurringSubscriptionBookings = async () => {
  const subscriptions = await Subscription.find({ status: 'active' })
    .populate('userId', 'name email phone timezone isSuspended')
    .populate('expertId', 'name userId timezone');

  let created = 0;
  let skipped = 0;

  for (const subscription of subscriptions) {
    const user = subscription.userId;
    const expert = subscription.expertId;
    if (!user || !expert || user.isSuspended) {
      skipped += 1;
      continue;
    }

    const timezone = subscription.timezone || user.timezone || expert.timezone || DEFAULT_TIMEZONE;
    const dateKeys = getFutureDateKeys(GENERATION_DAYS, timezone);

    for (const date of dateKeys) {
      if (!subscription.recurringDays.includes(dayOfWeekForDateKey(date))) continue;
      if (isAfterRenewalDate(date, subscription.renewalDate, timezone)) continue;

      const generatedExisting = subscription.generatedBookingIds?.length
        ? await Booking.findOne({
          _id: { $in: subscription.generatedBookingIds },
          date,
          timeSlot: subscription.sessionTime,
          status: { $ne: 'Cancelled' },
        }).select('_id')
        : null;

      if (generatedExisting) {
        skipped += 1;
        continue;
      }

      const existing = await Booking.findOne({
        subscriptionId: subscription._id,
        date,
        timeSlot: subscription.sessionTime,
        status: { $ne: 'Cancelled' },
      }).select('_id');

      if (existing) {
        await subscription.addGeneratedBooking(existing._id);
        skipped += 1;
        continue;
      }

      try {
        const booking = await createBookingForUser({
          user,
          payload: {
            expertId: String(expert._id || expert),
            serviceId: subscription.serviceSnapshot.serviceId
              ? String(subscription.serviceSnapshot.serviceId)
              : undefined,
            phone: user.phone || '',
            date,
            timeSlot: subscription.sessionTime,
            notes: 'Recurring subscription session',
            timezone,
          },
          bookingMeta: {
            bookingType: 'subscription',
            subscriptionId: subscription._id,
            sequenceNumber: (subscription.generatedBookingIds?.length || 0) + 1,
          },
          serviceSnapshotOverride: {
            serviceId: subscription.serviceSnapshot.serviceId,
            serviceName: subscription.serviceSnapshot.name,
            servicePrice: subscription.serviceSnapshot.price,
            serviceDuration: subscription.serviceSnapshot.durationMinutes,
          },
        });

        await subscription.addGeneratedBooking(booking._id);
        created += 1;
      } catch (err) {
        if (err.statusCode === 400 || err.statusCode === 409) {
          skipped += 1;
          continue;
        }
        console.error('[scheduler] subscription booking generation failed:', err.message);
      }
    }
  }

  console.log(`[scheduler] Subscription booking generation complete: ${created} created, ${skipped} skipped`);
  return { created, skipped };
};

export const sendUpcomingBookingReminders = async () => {
  const now = new Date();
  const windowStart = new Date(now.getTime() + 45 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 75 * 60 * 1000);
  const candidateDates = [
    ...new Set([
      getDateKey(now, DEFAULT_TIMEZONE),
      getDateKey(windowStart, DEFAULT_TIMEZONE),
      getDateKey(windowEnd, DEFAULT_TIMEZONE),
    ]),
  ];

  const bookings = await Booking.find({
    reminderSentAt: null,
    status: { $in: ['Pending', 'Confirmed'] },
    date: { $in: candidateDates },
  })
    .populate('userId', 'name email notificationPrefs')
    .populate('expertId', 'name category company');

  let sent = 0;

  for (const booking of bookings) {
    const startsAt = parseBookingStart(booking.date, booking.timeSlot, booking.timezone);
    if (!startsAt || startsAt < windowStart || startsAt > windowEnd) continue;

    const reserved = await Booking.findOneAndUpdate(
      { _id: booking._id, reminderSentAt: null },
      { $set: { reminderSentAt: new Date() } },
      { new: true }
    )
      .populate('userId', 'name email notificationPrefs')
      .populate('expertId', 'name category company');

    if (!reserved) continue;

    const user = reserved.userId || { name: reserved.name, email: reserved.email };
    if (user.notificationPrefs?.bookingEmail === false) continue;

    emailService.sendBookingReminderEmail(user, reserved, reserved.expertId);
    sent += 1;
  }

  if (sent > 0) console.log(`[scheduler] Sent ${sent} booking reminder email(s)`);
  return { sent };
};

export const expireNonRenewingSubscriptions = async () => {
  const result = await Subscription.updateMany(
    {
      autoRenew: false,
      renewalDate: { $lt: new Date() },
      status: { $in: ['active', 'paused', 'past_due'] },
    },
    {
      $set: {
        status: 'expired',
        expiresAt: new Date(),
      },
    }
  );

  if (result.modifiedCount > 0) {
    console.log(`[scheduler] Expired ${result.modifiedCount} non-renewing subscription(s)`);
  }

  return { expired: result.modifiedCount || 0 };
};

const scheduleJob = (expression, name, handler) => {
  const task = cron.schedule(
    expression,
    () => runSafely(name, handler),
    { timezone: DEFAULT_TIMEZONE }
  );
  tasks.push(task);
};

const runSafely = async (name, handler) => {
  try {
    await handler();
  } catch (err) {
    console.error(`[scheduler] ${name} failed:`, err.message);
  }
};

const getFutureDateKeys = (daysAhead, timezone) => {
  const keys = [];
  const seen = new Set();
  const now = Date.now();

  for (let offset = 0; offset <= daysAhead; offset += 1) {
    const key = getDateKey(new Date(now + offset * 86_400_000), timezone);
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }

  return keys;
};

const getDateKey = (date, timezone) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const dayOfWeekForDateKey = (dateKey) => new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();

const isAfterRenewalDate = (dateKey, renewalDate, timezone) => {
  if (!renewalDate) return false;
  return dateKey > getDateKey(renewalDate, timezone);
};

const parseBookingStart = (date, timeSlot, timezone = DEFAULT_TIMEZONE) => {
  try {
    const [time, period] = timeSlot.split(' ');
    let [hours, minutes] = time.split(':').map((value) => parseInt(value, 10));
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    if (timezone === 'Asia/Kolkata' || timezone === 'Asia/Calcutta') {
      return new Date(Date.UTC(
        parseInt(date.slice(0, 4), 10),
        parseInt(date.slice(5, 7), 10) - 1,
        parseInt(date.slice(8, 10), 10),
        hours - 5,
        minutes - 30
      ));
    }

    return new Date(`${date} ${timeSlot}`);
  } catch {
    return null;
  }
};

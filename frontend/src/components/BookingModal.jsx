import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import Modal from './Modal';
import { createBooking } from '../api/bookings';
import { createProgram, scheduleProgramSession } from '../api/programs';
import { createBookingOrder, verifyPayment } from '../api/payments';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatPrice, formatDuration } from '../utils/format';
import { CheckIcon, CalendarIcon, ClockIcon, ShieldIcon } from './Icons';

const schema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, 'Enter a valid phone number'),
  notes: z.string().max(500).optional(),
});

const BookingModal = ({ open, onClose, expert, slot, service, pkg, existingProgram }) => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(null);
  const [paying, setPaying] = useState(false);

  const programMutation = useMutation({
    mutationFn: async (values) => {
      const program = await createProgram({
        expertId: expert._id,
        serviceId: pkg.service._id,
        title: pkg.title,
        totalSessions: pkg.totalSessions,
        description: pkg.service.description || '',
      });
      const res = await scheduleProgramSession(program._id, 1, {
        date: slot.date,
        timeSlot: slot.time,
        phone: values.phone,
        notes: values.notes || '',
      });
      return res.booking;
    },
    onError: (err) => {
      if (err?.status === 409) {
        toast.error('This slot was just booked. Please pick another time.');
        queryClient.invalidateQueries({ queryKey: ['expert', expert?._id] });
        onClose();
      } else if (err?.status === 401) {
        toast.error('Please sign in to book');
        navigate('/login');
      } else {
        toast.error(err?.errors?.[0]?.message || err?.message || 'Could not start program');
      }
    },
  });

  const existingProgramMutation = useMutation({
    mutationFn: async (values) => {
      const res = await scheduleProgramSession(existingProgram.id, existingProgram.index, {
        date: slot.date,
        timeSlot: slot.time,
        phone: values.phone,
        notes: values.notes || '',
      });
      return res.booking;
    },
    onError: (err) => {
      if (err?.status === 409) {
        toast.error('This slot was just booked. Please pick another time.');
        queryClient.invalidateQueries({ queryKey: ['expert', expert?._id] });
        onClose();
      } else if (err?.status === 401) {
        toast.error('Please sign in to book');
        navigate('/login');
      } else {
        toast.error(err?.errors?.[0]?.message || err?.message || 'Could not schedule session');
      }
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { phone: user?.phone || '', notes: '' },
  });

  useEffect(() => {
    if (open) {
      setSuccess(null);
      reset({ phone: user?.phone || '', notes: '' });
    }
  }, [open, reset, user]);

  const bookingMutation = useMutation({
    mutationFn: createBooking,
    onError: (err) => {
      if (err?.status === 409) {
        toast.error('This slot was just booked. Please pick another time.');
        queryClient.invalidateQueries({ queryKey: ['expert', expert?._id] });
        onClose();
      } else if (err?.status === 401) {
        toast.error('Please sign in to book');
        navigate('/login');
      } else {
        toast.error(err?.errors?.[0]?.message || err?.message || 'Could not complete booking');
      }
    },
  });

  if (!open || !expert || !slot) return null;

  if (!isAuthenticated) {
    return (
      <Modal open={open} onClose={onClose} title="Sign in to book" description="Bookings are linked to your account.">
        <p className="text-sm text-ink-500 dark:text-ink-400">
          Create a free account or sign in to confirm this slot. It takes less than a minute.
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => navigate('/signup')} className="btn-primary">Create account</button>
          <button type="button" onClick={() => navigate('/login')} className="btn-secondary">Sign in</button>
        </div>
      </Modal>
    );
  }

  const onSubmit = async (values) => {
    try {
      let booking;
      if (existingProgram) {
        booking = await existingProgramMutation.mutateAsync(values);
      } else if (pkg) {
        booking = await programMutation.mutateAsync(values);
      } else {
        booking = await bookingMutation.mutateAsync({
          expertId: expert._id,
          serviceId: service?._id,
          date: slot.date,
          timeSlot: slot.time,
          phone: values.phone,
          notes: values.notes || '',
        });
      }

      // Payment flow (mock or razorpay)
      if (booking.paymentStatus === 'paid') {
        setSuccess(booking);
        queryClient.invalidateQueries({ queryKey: ['expert', expert._id] });
        queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] });
        if (pkg || existingProgram) queryClient.invalidateQueries({ queryKey: ['programs', 'me'] });
        toast.success(existingProgram ? `Session ${existingProgram.index} scheduled` : pkg ? 'Program started' : 'Session booked');
        return;
      }

      setPaying(true);
      const order = await createBookingOrder(booking._id);

      if (order.mockMode) {
        // Sandbox: skip checkout UI, instantly verify
        await verifyPayment({ paymentId: order.paymentId });
        setSuccess({ ...booking, paymentStatus: 'paid' });
      } else if (window.Razorpay && order.keyId) {
        await new Promise((resolve, reject) => {
          const rzp = new window.Razorpay({
            key: order.keyId,
            amount: order.amount * 100,
            currency: order.currency,
            order_id: order.orderId,
            name: 'Confer',
            description: service?.name || 'Session booking',
            prefill: { name: user.name, email: user.email, contact: values.phone },
            handler: async (resp) => {
              try {
                await verifyPayment({
                  paymentId: order.paymentId,
                  razorpayPaymentId: resp.razorpay_payment_id,
                  razorpaySignature: resp.razorpay_signature,
                });
                setSuccess({ ...booking, paymentStatus: 'paid' });
                resolve();
              } catch (e) { reject(e); }
            },
            modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
          });
          rzp.open();
        });
      } else {
        // Razorpay not loaded but live keys missing — surface clearly
        toast.error('Payment provider not configured');
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['expert', expert._id] });
      queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] });
      if (pkg || existingProgram) queryClient.invalidateQueries({ queryKey: ['programs', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Payment successful');
    } catch (err) {
      toast.error(err?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (success) {
    return (
      <Modal open={open} onClose={onClose} title="You're booked" description="Confirmation details below">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <CheckIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-white">Session confirmed</h3>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">A confirmation has been sent to {success.email}.</p>

          <dl className="mt-6 w-full divide-y divide-ink-100 rounded-lg border border-ink-200 text-left text-sm dark:divide-ink-800 dark:border-ink-800">
            <Row label="Expert" value={expert.name} />
            <Row label="Service" value={pkg ? pkg.title : success.serviceName} />
            <Row label="Date" value={formatDate(success.date, { weekday: 'long', month: 'long', year: 'numeric' })} />
            <Row label="Time" value={`${success.timeSlot} · ${formatDuration(success.serviceDuration)}`} />
            <Row label="Amount" value={formatPrice(pkg ? pkg.price : success.servicePrice)} />
            <Row label="Status" value={<span className="text-emerald-600 dark:text-emerald-400">{success.status}</span>} />
          </dl>
          <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => { onClose(); navigate('/dashboard'); }} className="btn-primary">View dashboard</button>
            <button type="button" onClick={onClose} className="btn-secondary">Done</button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Book a session" description={`with ${expert.name}`}>
      <div className="mb-5 rounded-lg border border-ink-100 bg-ink-50/70 px-4 py-3 dark:border-ink-800 dark:bg-ink-800/50">
        {(service || pkg || existingProgram) && (
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-ink-900 dark:text-white">
              {existingProgram ? `${existingProgram.title} (Session ${existingProgram.index})` : pkg ? pkg.title : service.name}
            </span>
            <span className="font-semibold text-ink-900 dark:text-white">{formatPrice(pkg ? pkg.price : service.price)}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-600 dark:text-ink-300">
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4 text-ink-500 dark:text-ink-400" />
            {formatDate(slot.date, { weekday: 'long', month: 'long', year: 'numeric' })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ClockIcon className="h-4 w-4 text-ink-500 dark:text-ink-400" />
            {slot.time}
            {(service || pkg || existingProgram) && <span className="text-ink-500 dark:text-ink-400">· {pkg ? `${pkg.totalSessions} sessions` : formatDuration(service.durationMinutes)}</span>}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="rounded-lg border border-ink-200 bg-white px-4 py-3 dark:border-ink-800 dark:bg-ink-900">
          <div className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">Booking as</div>
          <div className="mt-1 text-sm font-medium text-ink-900 dark:text-white">{user.name}</div>
          <div className="text-xs text-ink-500 dark:text-ink-400">{user.email}</div>
        </div>

        <div>
          <label htmlFor="phone" className="label">Phone</label>
          <input id="phone" type="tel" autoComplete="tel" placeholder="+91 98xxxxxxxx" className="input"
            aria-invalid={!!errors.phone} {...register('phone')} />
          {errors.phone && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.phone.message}</p>}
        </div>

        <div>
          <label htmlFor="notes" className="label">Notes <span className="font-normal text-ink-400">(optional)</span></label>
          <textarea id="notes" rows={3} placeholder="Anything you'd like the expert to know in advance?"
            className="input resize-none" {...register('notes')} />
        </div>

        <div className="flex items-center gap-2 rounded-md bg-ink-50 px-3 py-2 text-xs text-ink-500 dark:bg-ink-800/50 dark:text-ink-400">
          <ShieldIcon className="h-3.5 w-3.5" />
          Refundable up to 24 hours before the session.
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting || bookingMutation.isPending || programMutation?.isPending || existingProgramMutation?.isPending || paying} className="btn-primary min-w-[12rem]">
            {paying ? 'Processing payment…' :
              (isSubmitting || bookingMutation.isPending || programMutation?.isPending || existingProgramMutation?.isPending) ? 'Confirming...' :
              `Confirm · ${formatPrice(pkg ? pkg.price : (service?.price || expert.price))}`}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between px-4 py-3">
    <dt className="text-ink-500 dark:text-ink-400">{label}</dt>
    <dd className="font-medium text-ink-900 dark:text-white">{value}</dd>
  </div>
);

export default BookingModal;

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import Modal from './Modal';
import { submitReview } from '../api/reviews';
import { StarIcon, CheckIcon } from './Icons';

const schema = z.object({
  rating: z.number().int().min(1, 'Pick a rating').max(5),
  text: z.string().trim().min(10, 'Tell us a bit more (at least 10 characters)').max(2000),
});

const ReviewBookingModal = ({ open, onClose, booking }) => {
  const queryClient = useQueryClient();
  const [done, setDone] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { rating: 0, text: '' },
  });

  const rating = watch('rating');

  useEffect(() => {
    if (open) {
      setDone(false);
      reset({ rating: 0, text: '' });
    }
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (values) => submitReview({ bookingId: booking._id, ...values }),
    onSuccess: () => {
      setDone(true);
      queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['expert', booking?.expertId?._id] });
      toast.success('Thank you for your review');
    },
    onError: (err) => toast.error(err?.errors?.[0]?.message || err?.message || 'Could not post review'),
  });

  if (!open || !booking) return null;

  if (done) {
    return (
      <Modal open={open} onClose={onClose} title="Review posted" description="">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <CheckIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-white">Your review is live</h3>
          <p className="mt-1 max-w-sm text-sm text-ink-500 dark:text-ink-400">
            Thanks for sharing your experience — it helps other members find the right expert.
          </p>
          <button type="button" onClick={onClose} className="btn-primary mt-6">Done</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Leave a review" description={`for ${booking.expertId?.name || 'this session'}`}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5" noValidate>
        <div>
          <label className="label">How was your session?</label>
          <div className="mt-1 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setValue('rating', n, { shouldValidate: true })}
                className="rounded p-1 transition-transform hover:scale-110"
                aria-label={`${n} star${n === 1 ? '' : 's'}`}>
                <StarIcon filled
                  className={clsx('h-7 w-7', n <= rating ? 'text-amber-500' : 'text-ink-200 dark:text-ink-700')} />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm font-medium text-ink-700 dark:text-ink-200">
                {rating}/5
              </span>
            )}
          </div>
          {errors.rating && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.rating.message}</p>}
        </div>

        <div>
          <label htmlFor="reviewText" className="label">Your review</label>
          <textarea id="reviewText" rows={5} className="input resize-none"
            placeholder="What went well? What did you take away from the session?"
            aria-invalid={!!errors.text} {...register('text')} />
          {errors.text && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.text.message}</p>}
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary min-w-[10rem]">
            {isSubmitting || mutation.isPending ? 'Posting...' : 'Post review'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReviewBookingModal;

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import Modal from './Modal';
import { startConversation } from '../api/messages';
import { useAuth } from '../context/AuthContext';
import { CheckIcon, ArrowRightIcon } from './Icons';

const schema = z.object({
  subject: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, 'Tell the expert a bit more (at least 10 characters)').max(2000),
});

const MessageExpertModal = ({ open, onClose, expert }) => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [done, setDone] = useState(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { subject: '', message: '' },
  });

  useEffect(() => {
    if (open) {
      setDone(null);
      reset({ subject: '', message: '' });
    }
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: startConversation,
    onSuccess: (convo) => {
      setDone(convo);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Your message was sent');
    },
    onError: (err) => {
      if (err?.status === 401) {
        toast.error('Please sign in to message');
        navigate('/login');
      } else {
        toast.error(err?.errors?.[0]?.message || err?.message || 'Could not send message');
      }
    },
  });

  if (!open || !expert) return null;

  if (!isAuthenticated) {
    return (
      <Modal open={open} onClose={onClose} title="Sign in to message" description="Messaging is tied to your account.">
        <p className="text-sm text-ink-500 dark:text-ink-400">
          Create an account or sign in to keep all conversations in one inbox.
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => navigate('/signup')} className="btn-primary">Create account</button>
          <button type="button" onClick={() => navigate('/login')} className="btn-secondary">Sign in</button>
        </div>
      </Modal>
    );
  }

  const onSubmit = (values) => {
    mutation.mutate({ expertId: expert._id, ...values });
  };

  if (done) {
    return (
      <Modal open={open} onClose={onClose} title="Message sent" description="">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <CheckIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-white">Your message is on its way</h3>
          <p className="mt-1 max-w-sm text-sm text-ink-500 dark:text-ink-400">
            {expert.name} typically responds within {expert.stats?.responseTimeHours || 24} hours. Replies will land in your inbox.
          </p>
          <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => { onClose(); navigate('/messages'); }} className="btn-primary">
              Open inbox <ArrowRightIcon className="h-4 w-4" />
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Done</button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={`Message ${expert.name}`} description="Ask a question before booking.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="rounded-lg border border-ink-200 bg-white px-4 py-3 dark:border-ink-800 dark:bg-ink-900">
          <div className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">Sending as</div>
          <div className="mt-1 text-sm font-medium text-ink-900 dark:text-white">{user.name}</div>
          <div className="text-xs text-ink-500 dark:text-ink-400">{user.email}</div>
        </div>

        <div>
          <label htmlFor="subject" className="label">Subject <span className="font-normal text-ink-400">(optional)</span></label>
          <input id="subject" type="text" className="input" placeholder="Quick question about your services" {...register('subject')} />
        </div>

        <div>
          <label htmlFor="message" className="label">Your message</label>
          <textarea id="message" rows={5} className="input resize-none"
            placeholder="Tell the expert what you'd like help with."
            aria-invalid={!!errors.message} {...register('message')} />
          {errors.message && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.message.message}</p>}
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary min-w-[10rem]">
            {isSubmitting || mutation.isPending ? 'Sending...' : 'Send message'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default MessageExpertModal;

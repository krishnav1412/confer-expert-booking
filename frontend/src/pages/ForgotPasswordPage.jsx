import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { forgotPassword } from '../api/auth';
import { ArrowRightIcon, CheckCircleIcon } from '../components/Icons';

const schema = z.object({ email: z.string().trim().email('Enter a valid email') });

const ForgotPasswordPage = () => {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }) => {
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err?.message || 'Could not send reset link');
    }
  };

  return (
    <div className="container-app py-20">
      <div className="mx-auto max-w-md">
        {sent ? (
          <div className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <CheckCircleIcon className="h-7 w-7" />
            </div>
            <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
              Check your email
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
              If an account with that email exists, we've sent a password reset link.
              It will expire in 60 minutes.
            </p>
            <p className="mt-2 text-xs text-ink-400 dark:text-ink-500">
              In development mode, the link is printed to the backend console.
            </p>
            <Link to="/login" className="btn-secondary mt-8 w-full">Back to sign in</Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
              Forgot your password?
            </h1>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
              Enter your email and we'll send you a link to reset it.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input id="email" type="email" autoComplete="email" placeholder="you@company.com"
                  className="input" aria-invalid={!!errors.email} {...register('email')} />
                {errors.email && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? 'Sending…' : 'Send reset link'}
                {!isSubmitting && <ArrowRightIcon className="h-4 w-4" />}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
              Remembered it?{' '}
              <Link to="/login" className="font-medium text-ink-900 hover:underline dark:text-white">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

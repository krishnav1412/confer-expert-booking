import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { resetPassword } from '../api/auth';
import { ArrowRightIcon, CheckCircleIcon } from '../components/Icons';

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[a-zA-Z]/, 'Must contain a letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const [done, setDone] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (!token) {
      toast.error('Reset link is missing a token');
    }
  }, [token]);

  const onSubmit = async ({ newPassword }) => {
    try {
      await resetPassword({ token, newPassword });
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err) {
      toast.error(err?.message || 'Reset link is invalid or expired');
    }
  };

  if (done) {
    return (
      <div className="container-app py-20">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <CheckCircleIcon className="h-7 w-7" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
            Password reset
          </h1>
          <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">
            You can now sign in with your new password. Redirecting you to the login screen…
          </p>
          <Link to="/login" className="btn-primary mt-8 w-full">Sign in now</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-20">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
          Choose a new password
        </h1>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
          Use at least 8 characters with a mix of letters and numbers.
        </p>

        {!token && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            This reset link is missing its token. Request a new one from the
            <Link to="/forgot-password" className="ml-1 font-semibold underline">forgot password page</Link>.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
          <div>
            <label htmlFor="newPassword" className="label">New password</label>
            <input id="newPassword" type="password" autoComplete="new-password" placeholder="••••••••"
              className="input" aria-invalid={!!errors.newPassword} {...register('newPassword')} />
            {errors.newPassword && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.newPassword.message}</p>}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="label">Confirm new password</label>
            <input id="confirmPassword" type="password" autoComplete="new-password" placeholder="••••••••"
              className="input" aria-invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting || !token} className="btn-primary w-full">
            {isSubmitting ? 'Updating…' : 'Update password'}
            {!isSubmitting && <ArrowRightIcon className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

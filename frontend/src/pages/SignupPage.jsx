import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { CheckCircleIcon, ArrowRightIcon } from '../components/Icons';

const schema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
    email: z.string().trim().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await signup(values);
      toast.success('Welcome to Confer');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
            Free to get started. Apply to become an expert anytime.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
            <div>
              <label htmlFor="name" className="label">Full name</label>
              <input id="name" type="text" autoComplete="name" placeholder="Aarav Mehta" className="input"
                aria-invalid={!!errors.name} {...register('name')} />
              {errors.name && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" type="email" autoComplete="email" placeholder="you@company.com" className="input"
                aria-invalid={!!errors.email} {...register('email')} />
              {errors.email && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="label">Password</label>
                <input id="password" type="password" autoComplete="new-password" placeholder="••••••••" className="input"
                  aria-invalid={!!errors.password} {...register('password')} />
                {errors.password && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="label">Confirm</label>
                <input id="confirmPassword" type="password" autoComplete="new-password" placeholder="••••••••" className="input"
                  aria-invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
                {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <p className="text-xs text-ink-500 dark:text-ink-400">
              Min 8 characters, with at least one letter and one number.
            </p>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Creating account...' : 'Create account'}
              {!submitting && <ArrowRightIcon className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-ink-900 hover:underline dark:text-white">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden border-l border-ink-200 bg-gradient-to-br from-ink-50 to-white p-12 lg:flex lg:flex-col lg:justify-center dark:border-ink-800 dark:from-ink-900 dark:to-ink-950">
        <div className="max-w-md">
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-ink-900 dark:text-white">
            Built for serious learning,<br />
            <span className="text-ink-400 dark:text-ink-500">not generic advice.</span>
          </h2>
          <ul className="mt-8 space-y-3 text-sm text-ink-700 dark:text-ink-200">
            <li className="flex items-center gap-2.5"><CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />Indian-localised pricing in INR</li>
            <li className="flex items-center gap-2.5"><CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />Verified experts from CRED, Razorpay, Swiggy &amp; more</li>
            <li className="flex items-center gap-2.5"><CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />Cancellation credits and refunds</li>
            <li className="flex items-center gap-2.5"><CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />One account, both sides of the marketplace</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;

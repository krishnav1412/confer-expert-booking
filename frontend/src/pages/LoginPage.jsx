import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { CheckCircleIcon, ArrowRightIcon } from '../components/Icons';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from || '/';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await login(values);
      toast.success('Welcome back');
      navigate(from === '/login' ? '/' : from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Could not sign in');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (email, password) => {
    setValue('email', email);
    setValue('password', password);
  };

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
            Sign in to manage your bookings, messages, and profile.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="input"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="label">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="input"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Signing in...' : 'Sign in'}
              {!submitting && <ArrowRightIcon className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-ink-900 hover:underline dark:text-white">
              Sign up
            </Link>
          </p>

         
        </div>
      </div>

      {/* Right: marketing panel */}
      <div className="relative hidden border-l border-ink-200 bg-gradient-to-br from-ink-50 to-white p-12 lg:flex lg:flex-col lg:justify-center dark:border-ink-800 dark:from-ink-900 dark:to-ink-950">
        <div className="max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300">
            Built for serious growth
          </span>
          <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight text-ink-900 dark:text-white">
            Real People.<br />
            <span className="text-ink-400 dark:text-ink-500">Real Expertise.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-600 dark:text-ink-300">
            Book focused 1:1 sessions with founders, operators, engineers, creators, and experts who've already built what you're trying to achieve.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-ink-700 dark:text-ink-200">
            <Feature>Direct access to vetted experts</Feature>
            <Feature>Focused 1:1 mentorship sessions</Feature>
            <Feature>Private conversations and follow-ups</Feature>
            <Feature>Built for clarity, not noise</Feature>
          </ul>
        </div>
      </div>
    </div>
  );
};

const Feature = ({ children }) => (
  <li className="flex items-center gap-2.5">
    <CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
    {children}
  </li>
);

const DemoBtn = ({ email, password, label, onUse }) => (
  <button
    type="button"
    onClick={() => onUse(email, password)}
    className="flex w-full items-center justify-between rounded-md border border-ink-200 bg-white px-3 py-2 text-left transition-colors hover:border-ink-300 dark:border-ink-700 dark:bg-ink-900 dark:hover:border-ink-600"
  >
    <span>
      <span className="block text-xs font-semibold text-ink-900 dark:text-white">{label}</span>
      <span className="block text-xs text-ink-500 dark:text-ink-400">{email}</span>
    </span>
    <span className="text-xs font-medium text-ink-700 dark:text-ink-300">Use →</span>
  </button>
);

export default LoginPage;

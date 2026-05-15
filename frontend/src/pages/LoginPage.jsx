import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ArrowRightIcon } from '../components/Icons';
import AuthShell from '../components/auth/AuthShell';
import { PremiumButton } from '../components/design-system';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const AUTH_FEATURES = [
  'Direct access to vetted operators',
  'Sessions, programs, and subscriptions',
  'Private messaging and follow-ups',
  'Built for clarity, not noise',
];

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from || '/discover';

  const {
    register,
    handleSubmit,
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
      navigate(from === '/login' ? '/discover' : from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Could not sign in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your mentorship workspace."
      visualTitle="Real operators. Real momentum."
      visualSubtitle="Book focused sessions with founders, engineers, and experts who have already built what you are chasing."
      features={AUTH_FEATURES}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
          {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">Password</label>
            <Link to="/forgot-password" className="text-xs font-medium text-ink-400 hover:text-white">
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
          {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
        </div>

        <PremiumButton
          type="submit"
          variant="glow"
          magnetic
          disabled={submitting}
          className="w-full !py-3"
        >
          {submitting ? 'Signing in...' : 'Sign in'}
          {!submitting && <ArrowRightIcon className="h-4 w-4" />}
        </PremiumButton>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-medium text-white hover:underline">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
};

export default LoginPage;

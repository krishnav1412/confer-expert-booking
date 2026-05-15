import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ArrowRightIcon } from '../components/Icons';
import AuthShell from '../components/auth/AuthShell';
import { PremiumButton } from '../components/design-system';

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

const SIGNUP_FEATURES = [
  'Indian-localised pricing in INR',
  'Verified experts from top operators',
  'Cancellation credits and refunds',
  'One account — learner and mentor paths',
];

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
      navigate('/discover', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free to start. Apply to mentor anytime."
      visualTitle="Built for serious learning."
      visualSubtitle="Not generic advice — structured mentorship inside a premium workspace."
      features={SIGNUP_FEATURES}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="label">Full name</label>
          <input id="name" type="text" autoComplete="name" placeholder="Aarav Mehta" className="input"
            aria-invalid={!!errors.name} {...register('name')} />
          {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" placeholder="you@company.com" className="input"
            aria-invalid={!!errors.email} {...register('email')} />
          {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input id="password" type="password" autoComplete="new-password" placeholder="••••••••" className="input"
              aria-invalid={!!errors.password} {...register('password')} />
            {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="label">Confirm</label>
            <input id="confirmPassword" type="password" autoComplete="new-password" placeholder="••••••••" className="input"
              aria-invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword.message}</p>}
          </div>
        </div>

        <p className="text-xs text-ink-500">Min 8 characters, with at least one letter and one number.</p>

        <PremiumButton type="submit" variant="glow" magnetic disabled={submitting} className="w-full !py-3">
          {submitting ? 'Creating account...' : 'Create account'}
          {!submitting && <ArrowRightIcon className="h-4 w-4" />}
        </PremiumButton>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-white hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
};

export default SignupPage;

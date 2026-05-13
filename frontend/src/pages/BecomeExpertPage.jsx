import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { submitApplication, fetchMyApplications } from '../api/applications';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircleIcon,
  RupeeIcon,
  TrendingIcon,
  UsersIcon,
  ShieldIcon,
  ArrowRightIcon,
  XIcon,
} from '../components/Icons';

const CATEGORIES = [
  'Career Mentor',
  'Software Engineer',
  'UI/UX Expert',
  'AI Consultant',
  'Startup Advisor',
  'Product Manager',
  'Data Scientist',
  'Marketing Expert',
  'Fitness Coach',
];

const schema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{7,20}$/).optional().or(z.literal('')),
  category: z.string().min(1, 'Pick a category'),
  experienceYears: z.coerce.number().min(0).max(60),
  currentCompany: z.string().trim().max(120).optional().or(z.literal('')),
  linkedinUrl: z.string().trim().url().optional().or(z.literal('')),
  websiteUrl: z.string().trim().url().optional().or(z.literal('')),
  bio: z.string().trim().min(50, 'Bio must be at least 50 characters').max(1000),
  services: z.array(
    z.object({
      name: z.string().trim().min(2),
      price: z.coerce.number().min(0),
      durationMinutes: z.coerce.number().min(15),
    })
  ).min(1, 'Add at least one service'),
  availability: z.string().trim().max(500).optional().or(z.literal('')),
  motivation: z.string().trim().min(30).max(1000),
});

const BecomeExpertPage = () => {
  const { user, isExpert, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(null);

  const { data: existing = [] } = useQuery({
    queryKey: ['applications', 'me'],
    queryFn: fetchMyApplications,
  });
  const pendingApplication = existing.find((a) => a.status === 'Under Review');

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user?.name || '',
      phone: user?.phone || '',
      category: '',
      experienceYears: '',
      currentCompany: '',
      linkedinUrl: user?.socialLinks?.linkedin || '',
      websiteUrl: user?.socialLinks?.website || '',
      bio: user?.bio || '',
      services: [{ name: '', price: '', durationMinutes: 60 }],
      availability: '',
      motivation: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'services' });

  const mutation = useMutation({
    mutationFn: submitApplication,
    onSuccess: (data) => {
      setSubmitted(data);
      toast.success('Application submitted');
      refreshUser();
    },
    onError: (err) => toast.error(err?.errors?.[0]?.message || err?.message || 'Could not submit'),
  });

  const onSubmit = (values) => mutation.mutate(values);

  // Already an expert? Redirect.
  if (isExpert) {
    return (
      <div className="container-app py-20">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
            You're already an expert on Confer
          </h1>
          <p className="mt-3 text-base text-ink-500 dark:text-ink-400">
            Head over to your dashboard to manage services, availability, and bookings.
          </p>
          <button onClick={() => navigate('/expert-dashboard')} className="btn-primary mt-6">
            Go to expert dashboard <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (submitted || pendingApplication) {
    const app = submitted || { id: pendingApplication._id, status: pendingApplication.status };
    return (
      <div className="container-app py-20">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <CheckCircleIcon className="h-7 w-7" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
            Application received
          </h1>
          <p className="mt-3 text-base text-ink-500 dark:text-ink-400">
            Thanks for applying. Our team reviews each application carefully — most decisions go out within 5 working days.
          </p>
          <div className="mt-6 rounded-lg border border-ink-200 bg-white p-4 text-left text-sm dark:border-ink-800 dark:bg-ink-900">
            <div className="flex items-center justify-between">
              <span className="text-ink-500 dark:text-ink-400">Application ID</span>
              <span className="font-mono text-xs text-ink-700 dark:text-ink-200">{app.id}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-ink-500 dark:text-ink-400">Status</span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {app.status}
              </span>
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/" className="btn-primary">Back to home</Link>
            <Link to="/contact" className="btn-secondary">Contact us</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="border-b border-ink-200/70 bg-white dark:border-ink-800/70 dark:bg-ink-950">
        <div className="container-app py-16 sm:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-xs font-medium text-ink-600 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300">
              For experts
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl dark:text-white">
              Share what you know.
              <br />
              <span className="text-ink-400 dark:text-ink-500">Get paid for the value you create.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-500 sm:text-lg dark:text-ink-400">
              Confer is a curated marketplace for India's most respected operators, designers, engineers, and founders. We bring you serious clients, you bring the expertise.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Pillar icon={RupeeIcon} title="Keep up to 90%" subtitle="of every session you run" />
              <Pillar icon={TrendingIcon} title="3.2× more bookings" subtitle="than self-promoting alone" />
              <Pillar icon={UsersIcon} title="Vetted clients" subtitle="serious about your time" />
            </div>
          </div>
        </div>
      </section>

      <section className="container-app py-16">
        <div className="grid gap-10 lg:grid-cols-3">
          <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            <div className="card p-6">
              <h2 className="font-display text-base font-semibold text-ink-900 dark:text-white">What happens next</h2>
              <ol className="mt-4 space-y-4 text-sm">
                <Step n="1" title="Submit your application" body="Tell us about your expertise, services, and availability." />
                <Step n="2" title="We review" body="Our curation team reviews each application within 5 working days." />
                <Step n="3" title="Onboarding" body="Approved experts get a 30-minute onboarding call to set up their profile." />
                <Step n="4" title="Go live" body="Your profile becomes searchable and you start receiving bookings." />
              </ol>
            </div>
            <div className="card p-6">
              <ShieldIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="mt-3 font-display text-base font-semibold text-ink-900 dark:text-white">We're selective on purpose</h3>
              <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
                We only approve experts whose work and reputation we can verify.
              </p>
            </div>
          </aside>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 lg:col-span-2" noValidate>
            <div className="card p-6">
              <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white">About you</h3>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                Linked to your account: <span className="font-medium text-ink-700 dark:text-ink-200">{user?.email}</span>
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Full name" error={errors.fullName?.message}>
                  <input className="input" placeholder="Aarav Mehta" {...register('fullName')} />
                </Field>
                <Field label="Phone (optional)" error={errors.phone?.message}>
                  <input type="tel" className="input" placeholder="+91 98xxxxxxxx" {...register('phone')} />
                </Field>
                <Field label="Current company (optional)" error={errors.currentCompany?.message}>
                  <input className="input" placeholder="Razorpay" {...register('currentCompany')} />
                </Field>
                <Field label="Years of experience" error={errors.experienceYears?.message}>
                  <input type="number" min="0" max="60" className="input" placeholder="8" {...register('experienceYears')} />
                </Field>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Your expertise</h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Category" error={errors.category?.message}>
                  <select className="input" {...register('category')}>
                    <option value="">Pick a category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="LinkedIn URL (optional)" error={errors.linkedinUrl?.message}>
                  <input className="input" placeholder="https://linkedin.com/in/..." {...register('linkedinUrl')} />
                </Field>
                <Field label="Website / portfolio (optional)" error={errors.websiteUrl?.message} className="sm:col-span-2">
                  <input className="input" placeholder="https://..." {...register('websiteUrl')} />
                </Field>
              </div>
              <Field className="mt-4" label="Bio / About" error={errors.bio?.message}>
                <textarea rows={5} className="input resize-none"
                  placeholder="Tell us about your background, what you've built or led, and how you can help clients."
                  {...register('bio')} />
              </Field>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Services you'll offer</h3>
                <button type="button" onClick={() => append({ name: '', price: '', durationMinutes: 60 })} className="btn-secondary text-sm">
                  Add service
                </button>
              </div>
              {errors.services && !Array.isArray(errors.services) && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.services.message}</p>
              )}
              <div className="mt-5 space-y-4">
                {fields.map((f, i) => (
                  <div key={f.id} className="rounded-lg border border-ink-200 p-4 dark:border-ink-800">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-medium text-ink-900 dark:text-white">Service {i + 1}</span>
                      {fields.length > 1 && (
                        <button type="button" onClick={() => remove(i)}
                          className="grid h-7 w-7 place-items-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-ink-800 dark:hover:text-white">
                          <XIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <Field label="Name" error={errors.services?.[i]?.name?.message}>
                        <input className="input" placeholder="Resume Review" {...register(`services.${i}.name`)} />
                      </Field>
                      <Field label="Price (₹)" error={errors.services?.[i]?.price?.message}>
                        <input type="number" min="0" className="input" placeholder="2499" {...register(`services.${i}.price`)} />
                      </Field>
                      <Field label="Duration (min)" error={errors.services?.[i]?.durationMinutes?.message}>
                        <input type="number" min="15" className="input" placeholder="60" {...register(`services.${i}.durationMinutes`)} />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white">A bit more</h3>
              <div className="mt-5 space-y-4">
                <Field label="Typical availability (optional)" error={errors.availability?.message}>
                  <input className="input" placeholder="Weekday evenings, 7–10pm IST" {...register('availability')} />
                </Field>
                <Field label="Why do you want to join Confer?" error={errors.motivation?.message}>
                  <textarea rows={4} className="input resize-none"
                    placeholder="What kinds of clients do you want to help, and what unique perspective do you bring?"
                    {...register('motivation')} />
                </Field>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary min-w-[12rem]">
                {isSubmitting || mutation.isPending ? 'Submitting...' : 'Submit application'}
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

const Field = ({ label, error, children, className = '' }) => (
  <div className={className}>
    <label className="label">{label}</label>
    {children}
    {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
  </div>
);

const Pillar = ({ icon: Icon, title, subtitle }) => (
  <div className="rounded-xl border border-ink-200 bg-ink-50/50 p-4 dark:border-ink-800 dark:bg-ink-900/50">
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-ink-700 shadow-card dark:bg-ink-800 dark:text-ink-200">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{title}</h3>
        <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>
      </div>
    </div>
  </div>
);

const Step = ({ n, title, body }) => (
  <li className="flex gap-3">
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink-900 text-xs font-semibold text-white dark:bg-white dark:text-ink-900">{n}</span>
    <div>
      <div className="text-sm font-semibold text-ink-900 dark:text-white">{title}</div>
      <p className="mt-0.5 text-xs leading-relaxed text-ink-500 dark:text-ink-400">{body}</p>
    </div>
  </li>
);

export default BecomeExpertPage;

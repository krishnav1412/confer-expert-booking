import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import { fetchMyExpertProfile, updateMyExpertProfile, updateMyAvailability } from '../api/experts';
import { ExpertDetailSkeleton } from '../components/Skeletons';
import { XIcon, CalendarIcon, ClockIcon, CheckIcon } from '../components/Icons';

const TIME_OPTIONS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM',
  '07:00 PM', '08:00 PM',
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ExpertSettingsPage = () => {
  const [tab, setTab] = useState('profile');

  const { data: expert, isLoading } = useQuery({
    queryKey: ['expert', 'me'],
    queryFn: fetchMyExpertProfile,
  });

  if (isLoading || !expert) {
    return <div className="container-app py-12"><ExpertDetailSkeleton /></div>;
  }

  return (
    <div className="container-app py-12">
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
        Expert settings
      </h1>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
        Manage your public profile, services, and availability.
      </p>

      <div className="mt-8 border-b border-ink-200 dark:border-ink-800">
        <div className="-mb-px flex flex-wrap gap-1">
          {[
            { id: 'profile', label: 'Profile' },
            { id: 'services', label: 'Services & pricing' },
            { id: 'availability', label: 'Availability' },
          ].map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={clsx(
                'border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                tab === t.id
                  ? 'border-ink-900 text-ink-900 dark:border-white dark:text-white'
                  : 'border-transparent text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white'
              )}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 max-w-3xl">
        {tab === 'profile' && <ProfileTab expert={expert} />}
        {tab === 'services' && <ServicesTab expert={expert} />}
        {tab === 'availability' && <AvailabilityTab expert={expert} />}
      </div>
    </div>
  );
};

// ---------- Profile tab ----------
const profileSchema = z.object({
  bio: z.string().trim().min(20).max(2000),
  company: z.string().trim().max(120).optional().or(z.literal('')),
  experience: z.coerce.number().min(0).max(60),
  skills: z.string().optional(),
  profileImage: z.string().trim().url().optional().or(z.literal('')),
  linkedinUrl: z.string().trim().url().optional().or(z.literal('')),
  websiteUrl: z.string().trim().url().optional().or(z.literal('')),
  deliverables: z.string().optional(),
});

const ProfileTab = ({ expert }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: expert.bio || '',
      company: expert.company || '',
      experience: expert.experience || 0,
      skills: (expert.skills || []).join(', '),
      profileImage: expert.profileImage || '',
      linkedinUrl: expert.linkedinUrl || '',
      websiteUrl: expert.websiteUrl || '',
      deliverables: (expert.deliverables || []).join('\n'),
    },
  });

  const mutation = useMutation({
    mutationFn: updateMyExpertProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['expert', expert._id] });
      toast.success('Profile updated');
    },
    onError: (err) => toast.error(err?.errors?.[0]?.message || err?.message || 'Could not save'),
  });

  const onSubmit = (values) => {
    mutation.mutate({
      ...values,
      skills: values.skills ? values.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      deliverables: values.deliverables ? values.deliverables.split('\n').map((s) => s.trim()).filter(Boolean) : [],
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="card p-6">
        <h2 className="font-display text-base font-semibold text-ink-900 dark:text-white">Public profile</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Profile image URL" error={errors.profileImage?.message} className="sm:col-span-2">
            <input className="input" placeholder="https://..." {...register('profileImage')} />
          </Field>
          <Field label="Company" error={errors.company?.message}>
            <input className="input" placeholder="Razorpay" {...register('company')} />
          </Field>
          <Field label="Years of experience" error={errors.experience?.message}>
            <input type="number" min="0" max="60" className="input" {...register('experience')} />
          </Field>
          <Field label="Bio" error={errors.bio?.message} className="sm:col-span-2">
            <textarea rows={5} className="input resize-none" {...register('bio')} />
          </Field>
          <Field label="Skills (comma separated)" error={errors.skills?.message} className="sm:col-span-2">
            <input className="input" placeholder="System Design, DSA, Mentoring" {...register('skills')} />
          </Field>
          <Field label="Deliverables (one per line)" error={errors.deliverables?.message} className="sm:col-span-2">
            <textarea rows={4} className="input resize-none" placeholder="Action items doc&#10;Reading list&#10;Follow-up notes" {...register('deliverables')} />
          </Field>
          <Field label="LinkedIn" error={errors.linkedinUrl?.message}>
            <input className="input" placeholder="https://linkedin.com/in/..." {...register('linkedinUrl')} />
          </Field>
          <Field label="Website" error={errors.websiteUrl?.message}>
            <input className="input" placeholder="https://..." {...register('websiteUrl')} />
          </Field>
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary min-w-[10rem]">
          {isSubmitting || mutation.isPending ? 'Saving...' : 'Save profile'}
        </button>
      </div>
    </form>
  );
};

// ---------- Services tab ----------
const servicesSchema = z.object({
  services: z.array(
    z.object({
      _id: z.string().optional(),
      name: z.string().trim().min(2).max(120),
      description: z.string().trim().max(500).optional().or(z.literal('')),
      price: z.coerce.number().min(0),
      durationMinutes: z.coerce.number().min(15).max(480),
      active: z.boolean().optional(),
    })
  ).min(1, 'At least one service required'),
});

const ServicesTab = ({ expert }) => {
  const queryClient = useQueryClient();
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(servicesSchema),
    defaultValues: {
      services: expert.services?.length ? expert.services.map((s) => ({
        _id: s._id, name: s.name, description: s.description || '',
        price: s.price, durationMinutes: s.durationMinutes, active: s.active !== false,
      })) : [{ name: '', description: '', price: 0, durationMinutes: 60, active: true }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'services' });

  const mutation = useMutation({
    mutationFn: updateMyExpertProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['expert', expert._id] });
      toast.success('Services updated');
    },
    onError: (err) => toast.error(err?.errors?.[0]?.message || err?.message || 'Could not save'),
  });

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate({ services: v.services }))} className="space-y-6" noValidate>
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink-900 dark:text-white">Services you offer</h2>
          <button type="button" onClick={() => append({ name: '', description: '', price: 0, durationMinutes: 60, active: true })}
            className="btn-secondary text-sm">
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
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Name" error={errors.services?.[i]?.name?.message}>
                  <input className="input" placeholder="Resume Review" {...register(`services.${i}.name`)} />
                </Field>
                <Field label="Duration (min)" error={errors.services?.[i]?.durationMinutes?.message}>
                  <input type="number" min="15" className="input" {...register(`services.${i}.durationMinutes`)} />
                </Field>
                <Field label="Price (₹)" error={errors.services?.[i]?.price?.message}>
                  <input type="number" min="0" className="input" {...register(`services.${i}.price`)} />
                </Field>
                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2 text-sm text-ink-700 dark:text-ink-200">
                    <input type="checkbox" {...register(`services.${i}.active`)} className="h-4 w-4 rounded border-ink-300 text-ink-900 focus:ring-2 focus:ring-ink-900 dark:border-ink-700" />
                    Active (visible to clients)
                  </label>
                </div>
                <Field label="Description" className="sm:col-span-2">
                  <textarea rows={2} className="input resize-none" {...register(`services.${i}.description`)} />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary min-w-[10rem]">
          {isSubmitting || mutation.isPending ? 'Saving...' : 'Save services'}
        </button>
      </div>
    </form>
  );
};

// ---------- Availability tab ----------
const AvailabilityTab = ({ expert }) => {
  const queryClient = useQueryClient();
  const [weekly, setWeekly] = useState(() => {
    const map = {};
    (expert.weeklyTemplate || []).forEach((d) => { map[d.dayOfWeek] = d; });
    return DAYS.map((_, i) => map[i] || { dayOfWeek: i, enabled: false, slots: [] });
  });
  const [blocked, setBlocked] = useState(expert.blockedDates || []);
  const [newBlock, setNewBlock] = useState('');

  // Editable per-date overrides
  const [availableSlots, setAvailableSlots] = useState(expert.availableSlots || []);

  useEffect(() => {
    const map = {};
    (expert.weeklyTemplate || []).forEach((d) => { map[d.dayOfWeek] = d; });
    setWeekly(DAYS.map((_, i) => map[i] || { dayOfWeek: i, enabled: false, slots: [] }));
    setBlocked(expert.blockedDates || []);
    setAvailableSlots(expert.availableSlots || []);
  }, [expert]);

  const mutation = useMutation({
    mutationFn: updateMyAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['expert', expert._id] });
      toast.success('Availability saved');
    },
    onError: (err) => toast.error(err?.message || 'Could not save'),
  });

  const toggleDay = (i) => {
    const next = [...weekly];
    next[i] = { ...next[i], enabled: !next[i].enabled };
    setWeekly(next);
  };

  const toggleSlot = (i, time) => {
    const next = [...weekly];
    const slots = new Set(next[i].slots || []);
    if (slots.has(time)) slots.delete(time);
    else slots.add(time);
    next[i] = { ...next[i], slots: Array.from(slots).sort() };
    setWeekly(next);
  };

  const addBlocked = () => {
    if (!newBlock || !/^\d{4}-\d{2}-\d{2}$/.test(newBlock)) {
      toast.error('Use YYYY-MM-DD format');
      return;
    }
    if (!blocked.includes(newBlock)) setBlocked([...blocked, newBlock].sort());
    setNewBlock('');
  };

  const removeBlocked = (date) => setBlocked(blocked.filter((d) => d !== date));

  const save = () => mutation.mutate({ weeklyTemplate: weekly, blockedDates: blocked, availableSlots });

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="font-display text-base font-semibold text-ink-900 dark:text-white">Weekly schedule</h2>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Set the default times you're available each week.</p>

        <div className="mt-5 space-y-3">
          {weekly.map((d, i) => (
            <div key={i} className="rounded-lg border border-ink-200 p-4 dark:border-ink-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => toggleDay(i)}
                    className={clsx(
                      'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                      d.enabled ? 'bg-ink-900 dark:bg-white' : 'bg-ink-200 dark:bg-ink-700'
                    )}>
                    <span className={clsx(
                      'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform dark:bg-ink-900',
                      d.enabled ? 'translate-x-4' : 'translate-x-0.5'
                    )} />
                  </button>
                  <span className="text-sm font-medium text-ink-900 dark:text-white">{DAYS[i]}</span>
                </div>
                <span className="text-xs text-ink-500 dark:text-ink-400">
                  {d.enabled ? `${d.slots.length} slot${d.slots.length === 1 ? '' : 's'}` : 'Day off'}
                </span>
              </div>
              {d.enabled && (
                <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                  {TIME_OPTIONS.map((t) => {
                    const sel = d.slots.includes(t);
                    return (
                      <button key={t} type="button" onClick={() => toggleSlot(i, t)}
                        className={clsx(
                          'rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                          sel
                            ? 'border-ink-900 bg-ink-900 text-white dark:border-white dark:bg-white dark:text-ink-900'
                            : 'border-ink-200 text-ink-600 hover:border-ink-300 dark:border-ink-700 dark:text-ink-300 dark:hover:border-ink-600'
                        )}>
                        {sel && <CheckIcon className="mr-1 inline h-3 w-3" />}{t}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-base font-semibold text-ink-900 dark:text-white">Blocked dates</h2>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Specific dates you'll be unavailable, regardless of weekly schedule.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input type="date" className="input max-w-xs" value={newBlock}
            onChange={(e) => setNewBlock(e.target.value)} />
          <button type="button" onClick={addBlocked} className="btn-secondary text-sm">Block date</button>
        </div>
        {blocked.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {blocked.map((date) => (
              <button key={date} type="button" onClick={() => removeBlocked(date)}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-xs text-ink-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:border-red-500/40 dark:hover:bg-red-500/10">
                <CalendarIcon className="h-3 w-3" />{date}
                <XIcon className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="font-display text-base font-semibold text-ink-900 dark:text-white">Currently published slots</h2>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          What clients see right now. Manage day-by-day overrides here.
        </p>
        {availableSlots.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500 dark:text-ink-400">No published slots yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {availableSlots.map((g, idx) => (
              <div key={g.date} className="flex items-start justify-between gap-4 rounded-lg border border-ink-200 px-4 py-3 dark:border-ink-800">
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-ink-900 dark:text-white">
                    <CalendarIcon className="h-4 w-4 text-ink-500 dark:text-ink-400" />{g.date}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {g.slots.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 rounded-md bg-ink-100 px-1.5 py-0.5 text-xs text-ink-700 dark:bg-ink-800 dark:text-ink-200">
                        <ClockIcon className="h-3 w-3" />{s}
                      </span>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={() => setAvailableSlots(availableSlots.filter((_, i) => i !== idx))}
                  className="grid h-7 w-7 place-items-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-red-600 dark:hover:bg-ink-800">
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={mutation.isPending} className="btn-primary min-w-[10rem]">
          {mutation.isPending ? 'Saving...' : 'Save availability'}
        </button>
      </div>
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

export default ExpertSettingsPage;

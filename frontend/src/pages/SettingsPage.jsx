import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword } from '../api/users';
import Avatar from '../components/Avatar';
import AvatarUploader from '../components/AvatarUploader';

const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Singapore', 'Asia/Dubai',
  'Europe/London', 'Europe/Berlin',
  'America/New_York', 'America/Los_Angeles',
  'UTC',
];

const SettingsPage = () => {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('profile');

  return (
    <div className="container-app py-12">
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white">Settings</h1>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Manage your profile, security, and preferences.</p>

      <div className="mt-8 border-b border-ink-200 dark:border-ink-800">
        <div className="-mb-px flex flex-wrap gap-1">
          {[
            { id: 'profile', label: 'Profile' },
            { id: 'password', label: 'Password' },
            { id: 'notifications', label: 'Notifications' },
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

      <div className="mt-8 max-w-2xl">
        {tab === 'profile' && <ProfileForm user={user} refreshUser={refreshUser} />}
        {tab === 'password' && <PasswordForm />}
        {tab === 'notifications' && <NotificationPrefsForm user={user} refreshUser={refreshUser} />}
      </div>
    </div>
  );
};

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(500).optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  timezone: z.string().min(1),
  avatar: z.string().trim().url().optional().or(z.literal('')),
  socialLinks: z.object({
    linkedin: z.string().trim().url().optional().or(z.literal('')),
    twitter: z.string().trim().url().optional().or(z.literal('')),
    website: z.string().trim().url().optional().or(z.literal('')),
  }),
});

const ProfileForm = ({ user, refreshUser }) => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      phone: user?.phone || '',
      timezone: user?.timezone || 'Asia/Kolkata',
      avatar: user?.avatar || '',
      socialLinks: {
        linkedin: user?.socialLinks?.linkedin || '',
        twitter: user?.socialLinks?.twitter || '',
        website: user?.socialLinks?.website || '',
      },
    },
  });

  const avatarPreview = watch('avatar');

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      await refreshUser();
      toast.success('Profile updated');
    },
    onError: (err) => toast.error(err?.errors?.[0]?.message || err?.message || 'Could not update profile'),
  });

  const onSubmit = (values) => mutation.mutate(values);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="card p-6">
        <h2 className="font-display text-base font-semibold text-ink-900 dark:text-white">Profile photo</h2>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Visible across your dashboard, messages, and bookings.
        </p>
        <div className="mt-5">
          <AvatarUploader />
        </div>
        <details className="mt-5 text-sm">
          <summary className="cursor-pointer text-xs font-medium text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200">
            Use an external image URL instead
          </summary>
          <div className="mt-3 flex items-center gap-3">
            <Avatar src={avatarPreview} name={user?.name} size="md" />
            <div className="flex-1">
              <Field label="Avatar URL" error={errors.avatar?.message}>
                <input className="input" placeholder="https://..." {...register('avatar')} />
              </Field>
            </div>
          </div>
        </details>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-base font-semibold text-ink-900 dark:text-white">Public profile</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.name?.message}>
            <input className="input" {...register('name')} />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <input type="tel" className="input" placeholder="+91 98xxxxxxxx" {...register('phone')} />
          </Field>
          <Field label="Timezone" error={errors.timezone?.message} className="sm:col-span-2">
            <select className="input" {...register('timezone')}>
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </Field>
          <Field label="Short bio" error={errors.bio?.message} className="sm:col-span-2">
            <textarea rows={3} className="input resize-none" {...register('bio')} />
          </Field>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-base font-semibold text-ink-900 dark:text-white">Social links</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="LinkedIn" error={errors.socialLinks?.linkedin?.message}>
            <input className="input" placeholder="https://linkedin.com/in/..." {...register('socialLinks.linkedin')} />
          </Field>
          <Field label="Twitter / X" error={errors.socialLinks?.twitter?.message}>
            <input className="input" placeholder="https://x.com/..." {...register('socialLinks.twitter')} />
          </Field>
          <Field label="Website" error={errors.socialLinks?.website?.message} className="sm:col-span-2">
            <input className="input" placeholder="https://..." {...register('socialLinks.website')} />
          </Field>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary min-w-[10rem]">
          {isSubmitting || mutation.isPending ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  );
};

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(8, 'At least 8 characters').regex(/[a-zA-Z]/, 'At least one letter').regex(/[0-9]/, 'At least one number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

const PasswordForm = () => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Password changed');
      reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err) => toast.error(err?.message || 'Could not change password'),
  });

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="card space-y-5 p-6" noValidate>
      <h2 className="font-display text-base font-semibold text-ink-900 dark:text-white">Change password</h2>
      <div className="grid gap-4">
        <Field label="Current password" error={errors.currentPassword?.message}>
          <input type="password" autoComplete="current-password" className="input" {...register('currentPassword')} />
        </Field>
        <Field label="New password" error={errors.newPassword?.message}>
          <input type="password" autoComplete="new-password" className="input" {...register('newPassword')} />
        </Field>
        <Field label="Confirm new password" error={errors.confirmPassword?.message}>
          <input type="password" autoComplete="new-password" className="input" {...register('confirmPassword')} />
        </Field>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary min-w-[10rem]">
          {isSubmitting || mutation.isPending ? 'Changing...' : 'Change password'}
        </button>
      </div>
    </form>
  );
};

const NotificationPrefsForm = ({ user, refreshUser }) => {
  const [prefs, setPrefs] = useState({
    bookingEmail: user?.notificationPrefs?.bookingEmail ?? true,
    messageEmail: user?.notificationPrefs?.messageEmail ?? true,
    marketingEmail: user?.notificationPrefs?.marketingEmail ?? false,
  });

  useEffect(() => {
    if (user?.notificationPrefs) setPrefs({
      bookingEmail: user.notificationPrefs.bookingEmail ?? true,
      messageEmail: user.notificationPrefs.messageEmail ?? true,
      marketingEmail: user.notificationPrefs.marketingEmail ?? false,
    });
  }, [user]);

  const mutation = useMutation({
    mutationFn: () => updateProfile({ notificationPrefs: prefs }),
    onSuccess: async () => {
      await refreshUser();
      toast.success('Preferences saved');
    },
    onError: (err) => toast.error(err?.message || 'Could not save'),
  });

  return (
    <div className="card p-6">
      <h2 className="font-display text-base font-semibold text-ink-900 dark:text-white">Email notifications</h2>
      <div className="mt-5 divide-y divide-ink-100 dark:divide-ink-800">
        <Toggle label="Booking updates"
          description="Confirmations, cancellations, and reminders for sessions you book."
          checked={prefs.bookingEmail}
          onChange={(v) => setPrefs({ ...prefs, bookingEmail: v })} />
        <Toggle label="New messages"
          description="When someone replies to your conversations."
          checked={prefs.messageEmail}
          onChange={(v) => setPrefs({ ...prefs, messageEmail: v })} />
        <Toggle label="Product updates"
          description="Occasional emails about new features and recommended experts."
          checked={prefs.marketingEmail}
          onChange={(v) => setPrefs({ ...prefs, marketingEmail: v })} />
      </div>
      <div className="mt-5 flex justify-end">
        <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary min-w-[10rem]">
          {mutation.isPending ? 'Saving...' : 'Save preferences'}
        </button>
      </div>
    </div>
  );
};

const Toggle = ({ label, description, checked, onChange }) => (
  <label className="flex items-start justify-between gap-4 py-4">
    <div>
      <div className="text-sm font-medium text-ink-900 dark:text-white">{label}</div>
      <div className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{description}</div>
    </div>
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={clsx(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-ink-900 dark:bg-white' : 'bg-ink-200 dark:bg-ink-700'
      )}>
      <span className={clsx(
        'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform dark:bg-ink-900',
        checked ? 'translate-x-5' : 'translate-x-0.5'
      )} />
    </button>
  </label>
);

const Field = ({ label, error, children, className = '' }) => (
  <div className={className}>
    <label className="label">{label}</label>
    {children}
    {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
  </div>
);

export default SettingsPage;

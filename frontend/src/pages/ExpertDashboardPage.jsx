import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import { fetchMyExpertProfile, fetchMyAnalytics } from '../api/experts';
import { fetchExpertBookings, updateBookingStatus } from '../api/bookings';
import { fetchMyPrograms } from '../api/programs';
import { fetchMySubscriptions } from '../api/subscriptions';
import { listConversations } from '../api/messages';
import { createPromotion, verifyPayment } from '../api/payments';
import { useAuth } from '../context/AuthContext';

import Avatar from '../components/Avatar';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { RowSkeleton } from '../components/Skeletons';
import {
  CalendarIcon,
  ClockIcon,
  RupeeIcon,
  StarIcon,
  ChartIcon,
  AwardIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  UsersIcon,
} from '../components/Icons';
import { formatDate, formatPrice, formatDuration, formatRelativeTime } from '../utils/format';
import { SpatialCard, GlowOrb } from '../components/design-system';
import { Reveal } from '../components/design-system/Motion';

const PROMOTION_PLANS = [
  { id: 'weekly', label: '7 days', amount: 2499, blurb: 'Get featured for one week' },
  { id: 'monthly', label: '30 days', amount: 7999, blurb: 'Stay featured for a full month' },
];

const ExpertDashboardPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('upcoming');
  const queryClient = useQueryClient();

  const { data: expert, isLoading: expertLoading } = useQuery({
    queryKey: ['expert', 'me'],
    queryFn: fetchMyExpertProfile,
  });

  const { data: analytics } = useQuery({
    queryKey: ['expert', 'me', 'analytics'],
    queryFn: fetchMyAnalytics,
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', 'expert', 'me'],
    queryFn: fetchExpertBookings,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', 'expert'],
    queryFn: () => listConversations('expert'),
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['programs', 'me'],
    queryFn: fetchMyPrograms,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions', 'me'],
    queryFn: fetchMySubscriptions,
  });

  const today = new Date().toISOString().split('T')[0];
  const stats = useMemo(() => {
    const list = bookings || [];
    const upcoming = list.filter((b) => b.date >= today && b.status !== 'Cancelled' && b.status !== 'Completed');
    const completed = list.filter((b) => b.status === 'Completed');
    const pending = list.filter((b) => b.status === 'Pending');
    return { upcoming, completed, pending, all: list };
  }, [bookings, today]);

  const learningStats = useMemo(() => {
    const expertPrograms = (programs || []).filter((p) => sameId(p.expertId, expert?._id));
    const expertSubscriptions = (subscriptions || []).filter((s) => sameId(s.expertId, expert?._id));
    const activePrograms = expertPrograms.filter((p) => p.status === 'active');
    const activeSubscriptions = expertSubscriptions.filter((s) => s.status === 'active');
    const upcomingSubscriptionSessions = activeSubscriptions.reduce(
      (acc, subscription) => acc + (subscription.generatedBookingIds || [])
        .filter((b) => b.date >= today && b.status !== 'Cancelled' && b.status !== 'Completed').length,
      0
    );
    return {
      activePrograms,
      activeSubscriptions,
      pausedSubscriptions: expertSubscriptions.filter((s) => s.status === 'paused'),
      upcomingSubscriptionSessions,
      programStudents: new Set(activePrograms.map((p) => String(p.userId?._id || p.userId))).size,
      activeSubscribers: new Set(activeSubscriptions.map((s) => String(s.userId?._id || s.userId))).size,
    };
  }, [programs, subscriptions, expert?._id, today]);

  const visibleBookings =
    tab === 'upcoming' ? stats.upcoming :
    tab === 'completed' ? stats.completed :
    tab === 'pending' ? stats.pending :
    stats.all;

  const unreadInquiries = conversations.reduce((acc, c) => acc + (c.unreadByExpert || 0), 0);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'expert', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['expert', 'me', 'analytics'] });
      toast.success('Status updated');
    },
    onError: (err) => toast.error(err.message),
  });

  const promotionMutation = useMutation({
    mutationFn: async (plan) => {
      const order = await createPromotion(plan);
      // Mock-mode: instantly verify
      if (order.mockMode) {
        await verifyPayment({ paymentId: order.paymentId });
      }
      return order;
    },
    onSuccess: () => {
      toast.success('Your profile boost is live');
      queryClient.invalidateQueries({ queryKey: ['expert', 'me', 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['expert', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err) => toast.error(err.message || 'Could not start boost'),
  });

  if (expertLoading || !expert) {
    return <div className="container-app py-12"><RowSkeleton rows={4} /></div>;
  }

  return (
    <div className="container-app py-12">
      {/* Header */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={expert.profileImage} name={expert.name} size="lg" />
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
              Welcome back, {user.name.split(' ')[0]}
            </h1>
            <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">
              {expert.category}{expert.company && ` · ${expert.company}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link to={`/experts/${expert._id}`} className="btn-secondary text-sm bg-white/50 dark:bg-white/5">View public profile</Link>
          <Link to="/expert-settings" className="btn-secondary text-sm bg-white/50 dark:bg-white/5">Manage profile</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={RupeeIcon}
          label="Total revenue"
          value={formatPrice(analytics?.revenue || 0)}
          hint={`${stats.completed.length} completed`}
        />
        <KpiCard icon={CalendarIcon} label="Upcoming" value={stats.upcoming.length} />
        <KpiCard icon={UsersIcon} label="Unique clients" value={analytics?.uniqueClients || 0} />
        <KpiCard icon={UsersIcon} label="Subscribers" value={learningStats.activeSubscribers} hint={`${learningStats.upcomingSubscriptionSessions} subscription sessions`} />
        <KpiCard icon={CheckCircleIcon} label="Program students" value={learningStats.programStudents} hint={`${learningStats.activePrograms.length} active programs`} />
        <KpiCard icon={StarIcon} label="Rating" value={expert.rating?.toFixed(1) || '—'} hint={`${expert.stats?.profileViews || 0} profile views`} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        {/* Bookings */}
        <div className="lg:col-span-2">
          <div className="border-b border-ink-200 dark:border-ink-800">
            <div className="-mb-[2px] flex flex-wrap gap-2 sm:gap-6">
              {[
                { id: 'upcoming', label: 'Upcoming', count: stats.upcoming.length },
                { id: 'pending', label: 'Pending', count: stats.pending.length },
                { id: 'completed', label: 'Completed', count: stats.completed.length },
                { id: 'all', label: 'All', count: stats.all.length },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={clsx(
                    'relative border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                    tab === t.id
                      ? 'border-transparent text-ink-900 dark:text-white'
                      : 'border-transparent text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white'
                  )}
                >
                  <span
                    aria-hidden
                    className={clsx(
                      'absolute -bottom-[2px] left-0 right-0 h-[2px] bg-brand-500 shadow-[0_-2px_10px_rgba(99,102,241,0.5)] transition-opacity duration-200',
                      tab === t.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {t.label}
                  <span className={clsx(
                    'ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors',
                    tab === t.id ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300' : 'bg-ink-100 text-ink-600 dark:bg-white/5 dark:text-ink-400'
                  )}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div key={tab} className="ds-tab-panel">
                {bookingsLoading ? <RowSkeleton rows={3} />
                  : visibleBookings.length === 0 ? (
                    <EmptyState title="Nothing here yet"
                      description="When clients book or message you, sessions will appear here." />
                  ) : (
                    <div className="space-y-4">
                      {visibleBookings.map((b) => (
                        <BookingRow
                          key={b._id}
                          booking={b}
                          onStatusChange={(status) => statusMutation.mutate({ id: b._id, status })}
                        />
                      ))}
                    </div>
                  )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Promote profile */}
          <div className="card relative overflow-hidden p-6">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-amber-100/40 blur-2xl dark:bg-amber-500/10" />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20">
                <AwardIcon className="h-3 w-3" />
                Boost
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold text-ink-900 dark:text-white">
                Promote your profile
              </h3>
              {analytics?.activePromotion ? (
                <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <div className="font-semibold">Boost active</div>
                  <div className="mt-0.5 text-xs">
                    {analytics.activePromotion.plan} · until{' '}
                    {new Date(analytics.activePromotion.endsAt).toDateString()}
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
                    Get featured at the top of search and category pages. Promoted experts see 3.2× more bookings on average.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-ink-700 dark:text-ink-200">
                    <Bullet>Featured badge across the marketplace</Bullet>
                    <Bullet>Priority placement in your category</Bullet>
                    <Bullet>Homepage featured rotation</Bullet>
                  </ul>
                  <div className="mt-5 grid gap-2">
                    {PROMOTION_PLANS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        disabled={promotionMutation.isPending}
                        onClick={() => promotionMutation.mutate(p.id)}
                        className="flex items-center justify-between rounded-lg border border-ink-200 px-4 py-3 text-left transition-colors hover:border-ink-900 dark:border-ink-700 dark:hover:border-white"
                      >
                        <div>
                          <div className="text-sm font-semibold text-ink-900 dark:text-white">{p.label}</div>
                          <div className="text-xs text-ink-500 dark:text-ink-400">{p.blurb}</div>
                        </div>
                        <div className="font-display text-base font-bold text-ink-900 dark:text-white">
                          {formatPrice(p.amount)}
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-center text-xs text-ink-400 dark:text-ink-500">
                    Sandbox payments — no real charge in dev
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-ink-500 dark:text-ink-400" />
              <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">Programs & subscriptions</h3>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <Stat label="Active subscribers" value={learningStats.activeSubscribers} />
              <Stat label="Paused subscriptions" value={learningStats.pausedSubscriptions.length} />
              <Stat label="Program students" value={learningStats.programStudents} />
              <Stat label="Upcoming recurring sessions" value={learningStats.upcomingSubscriptionSessions} />
            </dl>
          </div>

          {/* Inbox preview */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">
                Recent inquiries
              </h3>
              {unreadInquiries > 0 && (
                <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-semibold text-white">
                  {unreadInquiries}
                </span>
              )}
            </div>
            {conversations.length === 0 ? (
              <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">
                No inquiries yet. They'll show up here when clients reach out.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {conversations.slice(0, 4).map((c) => (
                  <li key={c._id} className="flex items-start gap-3">
                    <Avatar name={c.userName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-ink-900 dark:text-white">
                          {c.userName}
                        </span>
                        <span className="shrink-0 text-xs text-ink-400 dark:text-ink-500">
                          {formatRelativeTime(c.lastMessageAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-sm text-ink-500 dark:text-ink-400">
                        {c.lastMessage?.text || c.subject || 'New conversation'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/messages?role=expert"
              className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-ink-700 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white">
              Open inbox <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {/* Analytics */}
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <ChartIcon className="h-4 w-4 text-ink-500 dark:text-ink-400" />
              <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">Analytics</h3>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <Stat label="Profile views" value={analytics?.profileViews || 0} />
              <Stat label="Sessions completed" value={analytics?.sessionsCompleted || 0} />
              <Stat label="Pending revenue" value={formatPrice(analytics?.pendingRevenue || 0)} />
              <Stat label="Cancelled" value={analytics?.cancelledSessions || 0} />
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ icon: Icon, label, value, hint }) => (
  <SpatialCard glow className="relative overflow-hidden p-6 group" padding={false}>
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon className="h-20 w-20 text-brand-500" />
    </div>
    <div className="flex items-center gap-3 text-ink-500 dark:text-ink-400">
      <div className="h-8 w-8 rounded-lg bg-ink-100 dark:bg-white/5 flex items-center justify-center">
        <Icon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest">{label}</span>
    </div>
    <div className="mt-4 font-display text-3xl font-bold text-ink-900 dark:text-white">{value}</div>
    {hint && <div className="mt-2 text-xs text-ink-500 dark:text-ink-400 font-medium">{hint}</div>}
  </SpatialCard>
);

const Stat = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <dt className="text-ink-500 dark:text-ink-400">{label}</dt>
    <dd className="font-medium text-ink-900 dark:text-white">{value}</dd>
  </div>
);

const Bullet = ({ children }) => (
  <li className="flex items-start gap-2">
    <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
    <span>{children}</span>
  </li>
);

const BookingRow = ({ booking, onStatusChange }) => {
  const userInfo = booking.userId || {};
  return (
    <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
      <Avatar src={userInfo.avatar} name={booking.name} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{booking.name}</h3>
          <span className="text-xs text-ink-500 dark:text-ink-400">{booking.email}</span>
        </div>
        <div className="mt-1 text-sm font-medium text-ink-700 dark:text-ink-200">{booking.serviceName}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500 dark:text-ink-400">
          <span className="inline-flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" />{formatDate(booking.date)}</span>
          <span className="inline-flex items-center gap-1.5"><ClockIcon className="h-4 w-4" />{booking.timeSlot} · {formatDuration(booking.serviceDuration)}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="font-medium text-ink-700 dark:text-ink-200">{formatPrice(booking.servicePrice)}</span>
        <StatusBadge status={booking.status} />
        {(booking.status === 'Pending' || booking.status === 'Confirmed') && (
          <div className="flex gap-1.5">
            {booking.status !== 'Confirmed' && (
              <button type="button" onClick={() => onStatusChange('Confirmed')} className="text-xs font-medium text-ink-700 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white">
                Confirm
              </button>
            )}
            <button type="button" onClick={() => onStatusChange('Completed')} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
              Complete
            </button>
            <button type="button" onClick={() => onStatusChange('Cancelled')} className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const sameId = (value, target) => String(value?._id || value || '') === String(target || '');

export default ExpertDashboardPage;

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

import { fetchMyBookings } from '../api/bookings';
import { fetchMyPrograms } from '../api/programs';
import { fetchMySubscriptions } from '../api/subscriptions';
import { listFavorites } from '../api/users';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { RowSkeleton } from '../components/Skeletons';
import {
  CalendarIcon,
  ClockIcon,
  InboxIcon,
  CheckCircleIcon,
  TrendingIcon,
  RupeeIcon,
  HeartIcon,
  StarIcon,
} from '../components/Icons';
import ReviewBookingModal from '../components/ReviewBookingModal';
import { formatDate, formatPrice, formatDuration } from '../utils/format';
import { SpatialCard, GlowOrb } from '../components/design-system';
import { Reveal } from '../components/design-system/Motion';

const UserDashboardPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('upcoming');
  const [reviewBooking, setReviewBooking] = useState(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings', 'me'],
    queryFn: fetchMyBookings,
  });

  const { data: programs = [], isLoading: programsLoading } = useQuery({
    queryKey: ['programs', 'me'],
    queryFn: fetchMyPrograms,
  });

  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['subscriptions', 'me'],
    queryFn: fetchMySubscriptions,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', 'me'],
    queryFn: listFavorites,
  });

  const today = new Date().toISOString().split('T')[0];

  const { upcoming, completed, all, totalSpend } = useMemo(() => {
    const list = bookings || [];
    const upc = list.filter((b) => b.date >= today && b.status !== 'Cancelled' && b.status !== 'Completed');
    const comp = list.filter((b) => b.status === 'Completed' || (b.date < today && b.status !== 'Cancelled'));
    const spend = list
      .filter((b) => b.status !== 'Cancelled' && b.paymentStatus === 'paid')
      .reduce((acc, b) => acc + (b.servicePrice || 0), 0);
    return { upcoming: upc, completed: comp, all: list, totalSpend: spend };
  }, [bookings, today]);

  const myPrograms = useMemo(
    () => (programs || []).filter((p) => sameId(p.userId, user?._id)),
    [programs, user?._id]
  );

  const mySubscriptions = useMemo(
    () => (subscriptions || []).filter((s) => sameId(s.userId, user?._id)),
    [subscriptions, user?._id]
  );

  const visibleList =
    tab === 'upcoming' ? upcoming :
    tab === 'completed' ? completed :
    tab === 'favorites' ? null :
    tab === 'programs' ? null :
    tab === 'subscriptions' ? null :
    all;

  return (
    <motion.div className="relative">
      <GlowOrb color="purple" size="lg" className="absolute -right-20 top-0 opacity-15" />
      <div className="container-app relative z-10 py-12">
      <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ds-caption mb-2">Your command center</p>
          <h1 className="ds-headline">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="ds-subtitle mt-2">Everything tied to your account in one place.</p>
        </div>
        <Link
          to="/discover"
          className="ds-btn-secondary shrink-0 !px-6 text-sm"
        >
          Discover mentors
        </Link>
      </Reveal>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarIcon} label="Upcoming" value={upcoming.length} />
        <StatCard icon={CheckCircleIcon} label="Completed" value={completed.length} />
        <StatCard icon={TrendingIcon} label="Total sessions" value={all.length} />
        <StatCard icon={RupeeIcon} label="Spent on Confer" value={formatPrice(totalSpend)} />
      </div>

      <div className="mt-10 border-b border-ink-200 dark:border-ink-800">
        <div className="-mb-[2px] flex flex-wrap gap-2 sm:gap-6">
          {[
            { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
            { id: 'completed', label: 'Completed', count: completed.length },
            { id: 'all', label: 'All bookings', count: all.length },
            { id: 'programs', label: 'My Programs', count: myPrograms.length },
            { id: 'subscriptions', label: 'My Subscriptions', count: mySubscriptions.length },
            { id: 'favorites', label: 'Favorites', count: favorites.length },
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
              {tab === t.id && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-brand-500 shadow-[0_-2px_10px_rgba(99,102,241,0.5)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
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

      <div className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'favorites' ? (
              favorites.length === 0 ? (
                <EmptyState
                  icon={HeartIcon}
                  title="No favorites yet"
                  description="Tap the heart on an expert's profile to save them here."
                  action={<Link to="/" className="btn-primary">Browse experts</Link>}
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {favorites.map((expert) => (
                    <Link key={expert._id} to={`/experts/${expert._id}`}
                      className="card flex items-center gap-4 p-5 transition-colors hover:border-brand-500/50 hover:shadow-glow">
                      <Avatar src={expert.profileImage} name={expert.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-ink-900 dark:text-white">{expert.name}</div>
                        <div className="text-sm text-ink-500 dark:text-ink-400">
                          {expert.category}{expert.company && ` · ${expert.company}`}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-ink-900 dark:text-white">
                        {formatPrice(expert.price)}
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : tab === 'programs' ? (
              programsLoading ? (
                <RowSkeleton rows={3} />
              ) : myPrograms.length === 0 ? (
                <EmptyState
                  icon={TrendingIcon}
                  title="No programs yet"
                  description="Start a package from an expert profile to track progress here."
                  action={<Link to="/" className="btn-primary">Browse experts</Link>}
                />
              ) : (
                <div className="space-y-4">
                  {myPrograms.map((program) => <ProgramRow key={program._id} program={program} />)}
                </div>
              )
            ) : tab === 'subscriptions' ? (
              subscriptionsLoading ? (
                <RowSkeleton rows={3} />
              ) : mySubscriptions.length === 0 ? (
                <EmptyState
                  icon={CalendarIcon}
                  title="No subscriptions yet"
                  description="Subscribe from an expert profile to keep recurring sessions organized."
                  action={<Link to="/" className="btn-primary">Browse experts</Link>}
                />
              ) : (
                <div className="space-y-4">
                  {mySubscriptions.map((subscription) => (
                    <SubscriptionRow key={subscription._id} subscription={subscription} />
                  ))}
                </div>
              )
            ) : isLoading ? (
              <RowSkeleton rows={3} />
            ) : visibleList.length === 0 ? (
              <EmptyState
                icon={InboxIcon}
                title={
                  tab === 'upcoming' ? 'No upcoming sessions' :
                  tab === 'completed' ? 'No completed sessions yet' :
                  'No bookings yet'
                }
                description="Browse the marketplace to book your first session."
                action={<Link to="/" className="btn-primary">Browse experts</Link>}
              />
            ) : (
              <div className="space-y-4">
                {visibleList.map((b) => <BookingRow key={b._id} booking={b} onReview={() => setReviewBooking(b)} />)}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <ReviewBookingModal
        open={!!reviewBooking}
        onClose={() => setReviewBooking(null)}
        booking={reviewBooking}
      />
      </div>
    </motion.div>
  );
};

const StatCard = ({ icon: Icon, label, value }) => (
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
  </SpatialCard>
);

const BookingRow = ({ booking, onReview }) => {
  const expert = booking.expertId || {};
  const canReview = booking.status === 'Completed';
  return (
    <SpatialCard className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center" padding={false} glow>
      <Avatar src={expert.profileImage} name={expert.name} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="text-base font-semibold text-ink-900 dark:text-white">{expert.name || 'Expert'}</h3>
          {expert.category && <span className="text-sm text-ink-500 dark:text-ink-400">· {expert.category}</span>}
        </div>
        <div className="mt-1 text-sm font-medium text-ink-700 dark:text-ink-200">{booking.serviceName}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-500 dark:text-ink-400">
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4" />
            {formatDate(booking.date, { weekday: 'short', month: 'long', year: 'numeric' })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ClockIcon className="h-4 w-4" />
            {booking.timeSlot} · {formatDuration(booking.serviceDuration)}
          </span>
          {booking.servicePrice > 0 && (
            <span className="font-medium text-ink-700 dark:text-ink-200">
              {formatPrice(booking.servicePrice)}
            </span>
          )}
          {booking.paymentStatus === 'pending' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20">
              Payment pending
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 sm:text-right">
        <StatusBadge status={booking.status} />
        <div className="mt-2 flex items-center gap-3 sm:justify-end">
          {canReview && (
            <button type="button" onClick={onReview}
              className="inline-flex items-center gap-1 text-xs font-medium text-ink-700 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white">
              <StarIcon className="h-3.5 w-3.5" /> Leave a review
            </button>
          )}
          {expert._id && (
            <Link to={`/experts/${expert._id}`}
              className="text-xs font-medium text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white">
              View expert →
            </Link>
          )}
        </div>
      </div>
    </SpatialCard>
  );
};

const ProgramRow = ({ program }) => {
  const expert = program.expertId || {};
  const nextSession = getNextSession(program.bookingIds);
  const completedSessions = program.progress?.completedSessions || 0;
  const isCompleted = completedSessions >= program.totalSessions;
  const progress = isCompleted ? 100 : (program.progress?.percent || 0);
  const scheduledCount = program.bookingIds?.length || 0;
  const isFullyScheduled = scheduledCount >= program.totalSessions;
  const remainingSessions = program.totalSessions - completedSessions;
  return (
    <div className="card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar src={expert.profileImage} name={expert.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-base font-semibold text-ink-900 dark:text-white">{program.title}</h3>
            {isCompleted ? (
              <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                Completed
              </span>
            ) : (
              <StatusPill status={program.status} />
            )}
          </div>
          <div className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {expert.name || 'Expert'}{expert.category && ` · ${expert.category}`}
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-ink-500 dark:text-ink-400">
              <span>{completedSessions} of {program.totalSessions} sessions completed · {remainingSessions} remaining</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <NextSessionLine session={nextSession} />
        </div>
        <div className="flex shrink-0 flex-col items-end justify-center gap-3 sm:w-48">
          <div className="text-sm font-semibold text-ink-900 dark:text-white">
            {formatPrice(program.packageSnapshot?.price || 0)}
          </div>
          {!isCompleted && (
            <Link
              to={isFullyScheduled ? '#' : `/experts/${expert._id}?scheduleProgram=${program._id}`}
              onClick={(e) => isFullyScheduled && e.preventDefault()}
              className={clsx('w-full text-center', isFullyScheduled ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-secondary')}
            >
              {isFullyScheduled ? 'All sessions scheduled' : 'Schedule next session'}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

const SubscriptionRow = ({ subscription }) => {
  const expert = subscription.expertId || {};
  const nextSession = getNextSession(subscription.generatedBookingIds);
  return (
    <div className="card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar src={expert.profileImage} name={expert.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-base font-semibold text-ink-900 dark:text-white">
              {subscription.serviceSnapshot?.name || 'Subscription'}
            </h3>
            <StatusPill status={subscription.status} />
          </div>
          <div className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {expert.name || 'Expert'} · {formatPlan(subscription.plan)}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-ink-500 dark:text-ink-400">
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4" />
              Renews {formatDate(subscription.renewalDate)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4" />
              {formatRecurringDays(subscription.recurringDays)} at {subscription.sessionTime}
            </span>
          </div>
          <NextSessionLine session={nextSession} />
        </div>
        <div className="shrink-0 text-sm font-semibold text-ink-900 dark:text-white">
          {formatPrice(subscription.serviceSnapshot?.price || 0)}
        </div>
      </div>
    </div>
  );
};

const NextSessionLine = ({ session }) => {
  if (!session) {
    return <div className="mt-2 text-sm text-ink-500 dark:text-ink-400">No upcoming sessions scheduled yet.</div>;
  }
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-ink-500 dark:text-ink-400">
      <span className="inline-flex items-center gap-1.5">
        <CalendarIcon className="h-4 w-4" />
        Next: {formatDate(session.date)}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ClockIcon className="h-4 w-4" />
        {session.timeSlot} · {formatDuration(session.serviceDuration)}
      </span>
    </div>
  );
};

const StatusPill = ({ status }) => (
  <span className="inline-flex rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-600 dark:bg-ink-800 dark:text-ink-300">
    {status}
  </span>
);

const sameId = (value, target) => String(value?._id || value || '') === String(target || '');

const getNextSession = (sessions = []) => {
  const today = new Date().toISOString().split('T')[0];
  return [...(sessions || [])]
    .filter((s) => s.date >= today && s.status !== 'Cancelled' && s.status !== 'Completed')
    .sort((a, b) => `${a.date} ${a.timeSlot}`.localeCompare(`${b.date} ${b.timeSlot}`))[0] || null;
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatRecurringDays = (days = []) =>
  days.map((day) => DAY_NAMES[day]).filter(Boolean).join(' ') || 'Recurring';

const formatPlan = (plan) => plan === 'yearly' ? 'Yearly' : 'Monthly';

export default UserDashboardPage;

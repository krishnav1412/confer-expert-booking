import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';

import { fetchMyBookings } from '../api/bookings';
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

const UserDashboardPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('upcoming');
  const [reviewBooking, setReviewBooking] = useState(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings', 'me'],
    queryFn: fetchMyBookings,
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

  const visibleList =
    tab === 'upcoming' ? upcoming :
    tab === 'completed' ? completed :
    tab === 'favorites' ? null :
    all;

  return (
    <div className="container-app py-12">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Everything tied to your account in one place.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarIcon} label="Upcoming" value={upcoming.length} />
        <StatCard icon={CheckCircleIcon} label="Completed" value={completed.length} />
        <StatCard icon={TrendingIcon} label="Total sessions" value={all.length} />
        <StatCard icon={RupeeIcon} label="Spent on Confer" value={formatPrice(totalSpend)} />
      </div>

      <div className="mt-10 border-b border-ink-200 dark:border-ink-800">
        <div className="-mb-px flex flex-wrap gap-1">
          {[
            { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
            { id: 'completed', label: 'Completed', count: completed.length },
            { id: 'all', label: 'All bookings', count: all.length },
            { id: 'favorites', label: 'Favorites', count: favorites.length },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={clsx(
                'border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                tab === t.id
                  ? 'border-ink-900 text-ink-900 dark:border-white dark:text-white'
                  : 'border-transparent text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white'
              )}
            >
              {t.label}
              <span className="ml-1.5 inline-flex items-center rounded-full bg-ink-100 px-1.5 py-0.5 text-[11px] font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {tab === 'favorites' ? (
          favorites.length === 0 ? (
            <EmptyState
              icon={HeartIcon}
              title="No favorites yet"
              description="Tap the heart on an expert's profile to save them here."
              action={<Link to="/" className="btn-primary">Browse experts</Link>}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {favorites.map((expert) => (
                <Link key={expert._id} to={`/experts/${expert._id}`}
                  className="card flex items-center gap-4 p-4 transition-colors hover:border-ink-300 dark:hover:border-ink-700">
                  <Avatar src={expert.profileImage} name={expert.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-ink-900 dark:text-white">{expert.name}</div>
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
          <div className="space-y-3">
            {visibleList.map((b) => <BookingRow key={b._id} booking={b} onReview={() => setReviewBooking(b)} />)}
          </div>
        )}
      </div>

      <ReviewBookingModal
        open={!!reviewBooking}
        onClose={() => setReviewBooking(null)}
        booking={reviewBooking}
      />
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="card p-5">
    <div className="flex items-center gap-2 text-ink-500 dark:text-ink-400">
      <Icon className="h-4 w-4" />
      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
    </div>
    <div className="mt-3 font-display text-2xl font-bold text-ink-900 dark:text-white">{value}</div>
  </div>
);

const BookingRow = ({ booking, onReview }) => {
  const expert = booking.expertId || {};
  const canReview = booking.status === 'Completed';
  return (
    <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
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
    </div>
  );
};

export default UserDashboardPage;

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAdminStats } from '../../api/admin';
import { formatPrice } from '../../utils/format';
import { RowSkeleton } from '../../components/Skeletons';
import {
  UsersIcon,
  AwardIcon,
  CalendarIcon,
  RupeeIcon,
  TrendingIcon,
  CheckCircleIcon,
  MessageIcon,
  StarIcon,
  ArrowRightIcon,
  ShieldIcon,
} from '../../components/Icons';

const AdminDashboardPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchAdminStats,
    refetchInterval: 60_000,
  });

  if (isLoading || !data) return <RowSkeleton rows={3} />;

  const cards = [
    { label: 'Total users', value: data.users.total, hint: `${data.users.newThisWeek} new this week`, icon: UsersIcon, to: '/admin/users' },
    { label: 'Active experts', value: data.users.experts, hint: `${data.users.admins} admin${data.users.admins === 1 ? '' : 's'}`, icon: AwardIcon, to: '/admin/experts' },
    { label: 'Pending applications', value: data.applications.pending, hint: 'Awaiting review', icon: ShieldIcon, to: '/admin/applications' },
    { label: 'Revenue (paid)', value: formatPrice(data.revenue.totalPaid), hint: `${data.bookings.paid} paid bookings`, icon: RupeeIcon, to: '/admin/bookings' },
    { label: 'Total bookings', value: data.bookings.total, hint: `${data.bookings.completed} completed · ${data.bookings.cancelled} cancelled`, icon: CalendarIcon, to: '/admin/bookings' },
    { label: 'Last 7 days', value: data.bookings.last7d, hint: `${data.bookings.last30d} in last 30d`, icon: TrendingIcon, to: '/admin/bookings' },
    { label: 'Active conversations', value: data.activeConversations, hint: 'Past 7 days', icon: MessageIcon, to: null },
    { label: 'Reviews', value: data.reviews.total, hint: `${data.users.suspended} suspended accounts`, icon: StarIcon, to: '/admin/reviews' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <section className="card p-6">
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="font-display text-base font-semibold text-ink-900 dark:text-white">Quick actions</h2>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            to="/admin/applications"
            title="Review applications"
            description={`${data.applications.pending} pending application${data.applications.pending === 1 ? '' : 's'} need a decision.`}
          />
          <ActionCard
            to="/admin/experts"
            title="Feature experts"
            description="Promote high-quality experts to the top of search and the homepage."
          />
          <ActionCard
            to="/admin/reviews"
            title="Moderate reviews"
            description="Remove spam, fake, or abusive reviews from public profiles."
          />
        </div>
      </section>
    </div>
  );
};

const StatCard = ({ label, value, hint, icon: Icon, to }) => {
  const inner = (
    <div className="card h-full p-5 transition-colors group-hover:border-ink-300 dark:group-hover:border-ink-700">
      <div className="flex items-center gap-2 text-ink-500 dark:text-ink-400">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-3 font-display text-2xl font-bold text-ink-900 dark:text-white">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-500 dark:text-ink-400">{hint}</div>}
    </div>
  );
  return to ? <Link to={to} className="group block">{inner}</Link> : inner;
};

const ActionCard = ({ to, title, description }) => (
  <Link to={to} className="card group flex flex-col p-5 transition-colors hover:border-ink-300 dark:hover:border-ink-700">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{title}</h3>
      <ArrowRightIcon className="h-4 w-4 text-ink-400 transition-transform group-hover:translate-x-1 dark:text-ink-500" />
    </div>
    <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">{description}</p>
  </Link>
);

export default AdminDashboardPage;

import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';

const NAV = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/applications', label: 'Applications' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/experts', label: 'Experts' },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/reviews', label: 'Reviews' },
];

const AdminLayout = () => (
  <div className="container-app py-10">
    <div className="mb-8">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-xs font-medium text-ink-600 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Admin
      </span>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
        Platform control
      </h1>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
        Approve experts, moderate content, and monitor activity.
      </p>
    </div>

    <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <nav className="flex flex-row gap-1 overflow-x-auto rounded-lg border border-ink-200 bg-white p-1 dark:border-ink-800 dark:bg-ink-900 lg:flex-col lg:gap-0.5 lg:overflow-visible">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main>
        <Outlet />
      </main>
    </div>
  </div>
);

export default AdminLayout;

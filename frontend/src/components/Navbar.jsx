import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import UserMenu from './UserMenu';
import NotificationBell from './NotificationBell';
import { SunIcon, MoonIcon, MenuIcon, XIcon } from './Icons';

const publicNav = [
  { to: '/', label: 'Home', end: true },
  { to: '/#how-it-works', label: 'How it works', end: false },
  { to: '/contact', label: 'Contact' },
];

const authedNav = [
  { to: '/discover', label: 'Discover', end: true },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/messages', label: 'Messages' },
  { to: '/contact', label: 'Contact' },
];

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, isExpert, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  const items = isAuthenticated ? authedNav : publicNav;

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-50 border-b border-white/5 bg-[rgb(var(--ds-glass-bg))]/60 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:bg-[rgb(var(--ds-bg-base))]/40"
    >
      <div className="container-app flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Confer home">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-gradient-to-br from-brand-500 to-accent-500 shadow-glow text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M5 7h14M5 12h14M5 17h9" />
            </svg>
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-ink-900 dark:text-white">
            Confer
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-ink-900 dark:text-white'
                    : 'text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          {isExpert && (
            <NavLink
              to="/expert-dashboard"
              className={({ isActive }) =>
                clsx(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'text-ink-900 dark:text-white' : 'text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white'
                )
              }
            >
              Expert
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                clsx(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'text-ink-900 dark:text-white' : 'text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white'
                )
              }
            >
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleTheme}
            className="grid h-9 w-9 place-items-center rounded-lg text-ink-600 transition-colors hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>

          {isAuthenticated ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
              <Link to="/signup" className="btn-primary text-sm">Sign up</Link>
            </div>
          )}

          <button type="button"
            className="grid h-9 w-9 place-items-center rounded-lg text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}>
            {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950 md:hidden">
          <nav className="container-app flex flex-col gap-1 py-3">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'rounded-md px-3 py-2.5 text-sm font-medium',
                    isActive
                      ? 'bg-ink-100 text-ink-900 dark:bg-ink-800 dark:text-white'
                      : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            {isExpert && (
              <NavLink to="/expert-dashboard" onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800">
                Expert dashboard
              </NavLink>
            )}
            {isAuthenticated ? (
              <>
                <NavLink to="/settings" onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800">
                  Settings
                </NavLink>
                {!isExpert && (
                  <Link to="/become-expert" onClick={() => setOpen(false)}
                    className="btn-primary mt-2 w-full">
                    Become an Expert
                  </Link>
                )}
              </>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary text-sm">Sign in</Link>
                <Link to="/signup" onClick={() => setOpen(false)} className="btn-primary text-sm">Sign up</Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </motion.header>
  );
};

export default Navbar;

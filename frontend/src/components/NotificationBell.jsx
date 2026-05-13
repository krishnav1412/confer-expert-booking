import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications';
import { formatRelativeTime } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const Bell = (p) => (
  <svg
    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}
  >
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const NotificationBell = () => {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications({ limit: 20 }),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!isAuthenticated) return null;

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-ink-600 transition-colors hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white dark:ring-ink-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card-hover dark:border-ink-800 dark:bg-ink-900">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 dark:border-ink-800">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                className="text-xs font-medium text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-ink-500 dark:text-ink-400">
                You're all caught up
              </div>
            ) : (
              <ul className="divide-y divide-ink-100 dark:divide-ink-800">
                {notifications.map((n) => {
                  const Wrap = n.actionUrl ? Link : 'div';
                  const wrapProps = n.actionUrl
                    ? {
                        to: n.actionUrl,
                        onClick: () => {
                          if (!n.read) markOne.mutate(n._id);
                          setOpen(false);
                        },
                      }
                    : {};
                  return (
                    <li key={n._id}>
                      <Wrap
                        {...wrapProps}
                        className={`block px-4 py-3 text-sm transition-colors ${
                          n.read ? '' : 'bg-brand-50/40 dark:bg-brand-500/5'
                        } ${n.actionUrl ? 'hover:bg-ink-50 dark:hover:bg-ink-800/60' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read && (
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-ink-900 dark:text-white">{n.title}</div>
                            {n.body && (
                              <div className="mt-0.5 line-clamp-2 text-xs text-ink-500 dark:text-ink-400">
                                {n.body}
                              </div>
                            )}
                            <div className="mt-1 text-[11px] text-ink-400 dark:text-ink-500">
                              {formatRelativeTime(n.createdAt)}
                            </div>
                          </div>
                        </div>
                      </Wrap>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';

import { fetchAdminBookings } from '../../api/admin';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { RowSkeleton } from '../../components/Skeletons';
import { formatDate, formatPrice } from '../../utils/format';

const STATUSES = ['all', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];
const PAY_STATUSES = ['all', 'pending', 'paid', 'failed', 'refunded'];

const AdminBookingsPage = () => {
  const [status, setStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [page, setPage] = useState(1);

  const params = { page, limit: 25 };
  if (status !== 'all') params.status = status;
  if (paymentStatus !== 'all') params.paymentStatus = paymentStatus;

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'bookings', params],
    queryFn: () => fetchAdminBookings(params),
  });

  const bookings = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Bookings</h2>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Inspect every booking across the platform.</p>
      </div>

      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <select className="input sm:w-48" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
        </select>
        <select className="input sm:w-52" value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}>
          {PAY_STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All payment states' : `Payment: ${s}`}</option>)}
        </select>
      </div>

      {isLoading ? <RowSkeleton rows={5} />
        : bookings.length === 0 ? <EmptyState title="No bookings" description="Try a different filter." />
        : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-ink-50/60 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:border-ink-800 dark:bg-ink-900/50 dark:text-ink-400">
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Expert</th>
                    <th className="px-5 py-3">Service</th>
                    <th className="px-5 py-3">When</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Payment</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id} className="border-b border-ink-100 last:border-0 dark:border-ink-800">
                      <td className="px-5 py-4">
                        <div className="font-medium text-ink-900 dark:text-white">{b.name}</div>
                        <div className="text-xs text-ink-500 dark:text-ink-400">{b.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-ink-900 dark:text-white">{b.expertId?.name || '—'}</div>
                        <div className="text-xs text-ink-500 dark:text-ink-400">{b.expertId?.category}</div>
                      </td>
                      <td className="px-5 py-4 text-ink-700 dark:text-ink-200">{b.serviceName}</td>
                      <td className="px-5 py-4 text-ink-500 dark:text-ink-400">
                        <div>{formatDate(b.date)}</div>
                        <div className="text-xs">{b.timeSlot}</div>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={b.status} /></td>
                      <td className="px-5 py-4">
                        <span className={clsx(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1',
                          b.paymentStatus === 'paid' && 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
                          b.paymentStatus === 'pending' && 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
                          b.paymentStatus === 'failed' && 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20',
                          b.paymentStatus === 'refunded' && 'bg-ink-100 text-ink-700 ring-ink-200 dark:bg-ink-800 dark:text-ink-200 dark:ring-ink-700',
                        )}>
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-ink-900 dark:text-white">
                        {formatPrice(b.servicePrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {pagination && pagination.pages > 1 && (
        <div className="mt-6">
          <Pagination page={pagination.page} pages={pagination.pages} onChange={setPage} />
        </div>
      )}
    </div>
  );
};

export default AdminBookingsPage;

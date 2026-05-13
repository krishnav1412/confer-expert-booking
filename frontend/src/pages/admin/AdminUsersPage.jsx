import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import {
  fetchAdminUsers,
  suspendAdminUser,
  unsuspendAdminUser,
  deleteAdminUser,
} from '../../api/admin';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { RowSkeleton } from '../../components/Skeletons';
import { useDebounce } from '../../hooks/useDebounce';
import { SearchIcon, ShieldIcon } from '../../components/Icons';
import { formatDate } from '../../utils/format';

const ROLES = [
  { id: 'all', label: 'All roles' },
  { id: 'user', label: 'Members' },
  { id: 'expert', label: 'Experts' },
  { id: 'admin', label: 'Admins' },
];

const STATUSES = [
  { id: 'all', label: 'Any status' },
  { id: 'active', label: 'Active' },
  { id: 'suspended', label: 'Suspended' },
];

const AdminUsersPage = () => {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(null); // { kind, user }
  const [suspendReason, setSuspendReason] = useState('');
  const queryClient = useQueryClient();

  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { search: debouncedSearch, role, status, page }],
    queryFn: () => fetchAdminUsers({ search: debouncedSearch, role, status, page, limit: 20 }),
  });

  const users = data?.data || [];
  const pagination = data?.pagination;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }) => suspendAdminUser(id, reason),
    onSuccess: () => { toast.success('User suspended'); invalidate(); setConfirm(null); setSuspendReason(''); },
    onError: (e) => toast.error(e?.message || 'Failed'),
  });
  const unsuspendMutation = useMutation({
    mutationFn: (id) => unsuspendAdminUser(id),
    onSuccess: () => { toast.success('User reinstated'); invalidate(); },
    onError: (e) => toast.error(e?.message || 'Failed'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminUser(id),
    onSuccess: () => { toast.success('User account scrubbed'); invalidate(); setConfirm(null); },
    onError: (e) => toast.error(e?.message || 'Failed'),
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Users</h2>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Search, suspend, or delete accounts.
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative w-full sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input type="search" placeholder="Name or email" className="input pl-9"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input sm:w-44" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <select className="input sm:w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {isLoading ? <RowSkeleton rows={5} />
        : users.length === 0 ? (
          <EmptyState title="No users match" description="Try a different filter or search term." />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-ink-50/60 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:border-ink-800 dark:bg-ink-900/50 dark:text-ink-400">
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Joined</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b border-ink-100 last:border-0 dark:border-ink-800">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={u.avatar} name={u.name} size="sm" />
                          <div className="min-w-0">
                            <div className="truncate font-medium text-ink-900 dark:text-white">{u.name}</div>
                            <div className="truncate text-xs text-ink-500 dark:text-ink-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <RoleBadge role={u.role} approved={u.isExpertApproved} />
                      </td>
                      <td className="px-5 py-4 text-ink-500 dark:text-ink-400">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        {u.isSuspended ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20">
                            <ShieldIcon className="h-3 w-3" /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex gap-3 text-xs font-medium">
                          {u.role !== 'admin' && (u.isSuspended ? (
                            <button type="button" onClick={() => unsuspendMutation.mutate(u._id)}
                              className="text-ink-700 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white">
                              Reinstate
                            </button>
                          ) : (
                            <button type="button" onClick={() => setConfirm({ kind: 'suspend', user: u })}
                              className="text-amber-700 hover:text-amber-800 dark:text-amber-400">
                              Suspend
                            </button>
                          ))}
                          {u.role !== 'admin' && (
                            <button type="button" onClick={() => setConfirm({ kind: 'delete', user: u })}
                              className="text-red-600 hover:text-red-700 dark:text-red-400">
                              Delete
                            </button>
                          )}
                        </div>
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

      {/* Suspend confirmation */}
      <Modal
        open={confirm?.kind === 'suspend'}
        onClose={() => { setConfirm(null); setSuspendReason(''); }}
        title={`Suspend ${confirm?.user?.name}?`}
        description="They will lose access immediately."
      >
        <div className="space-y-4">
          <div>
            <label className="label">Reason (optional)</label>
            <textarea rows={3} className="input resize-none"
              placeholder="Internal note — not shown to the user"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)} />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => { setConfirm(null); setSuspendReason(''); }} className="btn-secondary">Cancel</button>
            <button type="button"
              onClick={() => suspendMutation.mutate({ id: confirm.user._id, reason: suspendReason })}
              disabled={suspendMutation.isPending}
              className="btn-primary !bg-amber-600 hover:!bg-amber-700 dark:!bg-amber-500 dark:hover:!bg-amber-600 dark:!text-white">
              {suspendMutation.isPending ? 'Suspending…' : 'Suspend account'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={confirm?.kind === 'delete'}
        onClose={() => setConfirm(null)}
        title={`Delete ${confirm?.user?.name}?`}
        description="PII is scrubbed but bookings and reviews are kept for ledger integrity. This cannot be undone."
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => setConfirm(null)} className="btn-secondary">Cancel</button>
          <button type="button"
            onClick={() => deleteMutation.mutate(confirm.user._id)}
            disabled={deleteMutation.isPending}
            className="btn-primary !bg-red-600 hover:!bg-red-700 dark:!bg-red-500 dark:hover:!bg-red-600 dark:!text-white">
            {deleteMutation.isPending ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

const RoleBadge = ({ role, approved }) => {
  const cls = clsx(
    'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1',
    role === 'admin' && 'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:ring-purple-500/20',
    role === 'expert' && approved && 'bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/20',
    role === 'expert' && !approved && 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
    role === 'user' && 'bg-ink-100 text-ink-700 ring-ink-200 dark:bg-ink-800 dark:text-ink-200 dark:ring-ink-700',
  );
  return <span className={cls}>{role === 'expert' && !approved ? 'Expert (pending)' : role}</span>;
};

export default AdminUsersPage;

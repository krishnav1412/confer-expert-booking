import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import {
  fetchAdminApplications,
  approveApplication,
  rejectApplication,
} from '../../api/admin';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { RowSkeleton } from '../../components/Skeletons';
import { formatRelativeTime, formatPrice } from '../../utils/format';

const STATUSES = [
  { id: 'Under Review', label: 'Pending' },
  { id: 'Approved', label: 'Approved' },
  { id: 'Rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
];

const AdminApplicationsPage = () => {
  const [tab, setTab] = useState('Under Review');
  const [detail, setDetail] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['admin', 'applications', tab],
    queryFn: () => fetchAdminApplications(tab),
  });

  const approveMutation = useMutation({
    mutationFn: approveApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Expert approved — profile is live');
      setDetail(null);
    },
    onError: (err) => toast.error(err.message || 'Could not approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }) => rejectApplication(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Application rejected');
      setRejectingId(null);
      setDetail(null);
    },
    onError: (err) => toast.error(err.message || 'Could not reject'),
  });

  return (
    <div>
      <div className="border-b border-ink-200 dark:border-ink-800">
        <div className="-mb-px flex flex-wrap gap-1">
          {STATUSES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setTab(s.id)}
              className={clsx(
                'border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                tab === s.id
                  ? 'border-ink-900 text-ink-900 dark:border-white dark:text-white'
                  : 'border-transparent text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <RowSkeleton rows={3} />
        ) : applications.length === 0 ? (
          <EmptyState title="Nothing here" description="No applications in this state." />
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <Row
                key={app._id}
                app={app}
                onView={() => setDetail(app)}
                onApprove={() => approveMutation.mutate(app._id)}
                onReject={() => setRejectingId(app._id)}
                approving={approveMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.fullName || 'Application detail'}
        description={detail?.category || ''}
      >
        {detail && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-ink-200 p-4 dark:border-ink-800">
              <Info label="Email" value={detail.email || detail.userId?.email} />
              <Info label="Phone" value={detail.phone || '—'} />
              <Info label="Experience" value={`${detail.experienceYears} yr`} />
              <Info label="Company" value={detail.currentCompany || '—'} />
              {detail.linkedinUrl && <Info label="LinkedIn" value={<a href={detail.linkedinUrl} target="_blank" rel="noreferrer" className="text-brand-600 underline">View</a>} className="col-span-2" />}
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Bio</h3>
              <p className="mt-1.5 whitespace-pre-wrap text-ink-700 dark:text-ink-200">{detail.bio}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Services</h3>
              <div className="mt-2 space-y-2">
                {detail.services?.map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border border-ink-200 px-3 py-2 dark:border-ink-800">
                    <div>
                      <div className="font-medium text-ink-900 dark:text-white">{s.name}</div>
                      <div className="text-xs text-ink-500 dark:text-ink-400">{s.durationMinutes} min</div>
                    </div>
                    <div className="font-semibold text-ink-900 dark:text-white">{formatPrice(s.price)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Motivation</h3>
              <p className="mt-1.5 whitespace-pre-wrap text-ink-700 dark:text-ink-200">{detail.motivation}</p>
            </div>
            {detail.status === 'Under Review' && (
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setRejectingId(detail._id)} className="btn-secondary">Reject</button>
                <button type="button" disabled={approveMutation.isPending}
                  onClick={() => approveMutation.mutate(detail._id)} className="btn-primary">
                  {approveMutation.isPending ? 'Approving...' : 'Approve'}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject reason modal */}
      <RejectModal
        open={!!rejectingId}
        onClose={() => setRejectingId(null)}
        onConfirm={(notes) => rejectMutation.mutate({ id: rejectingId, notes })}
        loading={rejectMutation.isPending}
      />
    </div>
  );
};

const Row = ({ app, onView, onApprove, onReject, approving }) => (
  <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
    <Avatar name={app.fullName} size="md" />
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{app.fullName}</h3>
        <span className="text-xs text-ink-500 dark:text-ink-400">· {app.category}</span>
      </div>
      <div className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
        {app.email} · {app.experienceYears} yrs experience
        {app.currentCompany && ` · ${app.currentCompany}`}
      </div>
      <div className="mt-1 text-xs text-ink-400 dark:text-ink-500">
        Applied {formatRelativeTime(app.createdAt)}
      </div>
    </div>
    <div className="flex flex-wrap gap-2 sm:shrink-0">
      <button type="button" onClick={onView} className="btn-secondary text-xs">View</button>
      {app.status === 'Under Review' && (
        <>
          <button type="button" onClick={onReject} className="btn-secondary text-xs">Reject</button>
          <button type="button" onClick={onApprove} disabled={approving} className="btn-primary text-xs">
            {approving ? 'Approving...' : 'Approve'}
          </button>
        </>
      )}
      {app.status !== 'Under Review' && (
        <span className={clsx(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          app.status === 'Approved'
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20'
            : 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20'
        )}>
          {app.status}
        </span>
      )}
    </div>
  </div>
);

const RejectModal = ({ open, onClose, onConfirm, loading }) => {
  const [notes, setNotes] = useState('');
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="Reject application" description="Optional note included in the rejection email.">
      <textarea rows={4} className="input resize-none" placeholder="Reason (visible to the applicant)..."
        value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="button" disabled={loading} onClick={() => onConfirm(notes)}
          className="btn-primary !bg-red-600 hover:!bg-red-700 dark:!bg-red-500 dark:!text-white dark:hover:!bg-red-600">
          {loading ? 'Rejecting...' : 'Reject application'}
        </button>
      </div>
    </Modal>
  );
};

const Info = ({ label, value, className = '' }) => (
  <div className={className}>
    <div className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">{label}</div>
    <div className="mt-0.5 text-sm text-ink-900 dark:text-white">{value}</div>
  </div>
);

export default AdminApplicationsPage;

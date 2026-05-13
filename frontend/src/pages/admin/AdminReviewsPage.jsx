import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import { fetchAdminReviews, deleteAdminReview } from '../../api/admin';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { RowSkeleton } from '../../components/Skeletons';
import { StarIcon } from '../../components/Icons';
import { formatRelativeTime } from '../../utils/format';

const AdminReviewsPage = () => {
  const [minRating, setMinRating] = useState('');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const queryClient = useQueryClient();

  const params = { page, limit: 20 };
  if (minRating) params.minRating = minRating;

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reviews', params],
    queryFn: () => fetchAdminReviews(params),
  });

  const reviews = data?.data || [];
  const pagination = data?.pagination;

  const deleteMutation = useMutation({
    mutationFn: deleteAdminReview,
    onSuccess: () => {
      toast.success('Review removed');
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      setConfirmDelete(null);
    },
    onError: (e) => toast.error(e?.message || 'Failed'),
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Reviews</h2>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Remove spam, abuse, or inaccurate reviews.</p>
      </div>

      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <select className="input sm:w-52" value={minRating} onChange={(e) => { setMinRating(e.target.value); setPage(1); }}>
          <option value="">All ratings</option>
          <option value="1">1+ stars</option>
          <option value="2">2+ stars</option>
          <option value="3">3+ stars</option>
          <option value="4">4+ stars</option>
          <option value="5">5 stars only</option>
        </select>
      </div>

      {isLoading ? <RowSkeleton rows={5} />
        : reviews.length === 0 ? <EmptyState title="No reviews" description="No reviews match this filter." />
        : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r._id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarIcon key={i} filled
                            className={clsx('h-3.5 w-3.5', i < r.rating ? 'text-amber-500' : 'text-ink-200 dark:text-ink-700')} />
                        ))}
                      </div>
                      {r.verified && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                          Verified
                        </span>
                      )}
                      <span className="text-xs text-ink-400 dark:text-ink-500">{formatRelativeTime(r.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink-700 dark:text-ink-200">"{r.text}"</p>
                    <div className="mt-3 text-xs text-ink-500 dark:text-ink-400">
                      By <span className="font-medium text-ink-700 dark:text-ink-200">{r.reviewerName}</span>
                      {' · '}
                      Expert{' '}
                      <Link to={`/experts/${r.expertId?._id}`} className="font-medium text-ink-700 hover:underline dark:text-ink-200">
                        {r.expertId?.name}
                      </Link>
                    </div>
                  </div>
                  <button type="button" onClick={() => setConfirmDelete(r)}
                    className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      {pagination && pagination.pages > 1 && (
        <div className="mt-6">
          <Pagination page={pagination.page} pages={pagination.pages} onChange={setPage} />
        </div>
      )}

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remove this review?"
        description="This cannot be undone. The expert's aggregate rating will be recomputed."
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => setConfirmDelete(null)} className="btn-secondary">Cancel</button>
          <button type="button"
            onClick={() => deleteMutation.mutate(confirmDelete._id)}
            disabled={deleteMutation.isPending}
            className="btn-primary !bg-red-600 hover:!bg-red-700 dark:!bg-red-500 dark:hover:!bg-red-600 dark:!text-white">
            {deleteMutation.isPending ? 'Removing…' : 'Remove review'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminReviewsPage;

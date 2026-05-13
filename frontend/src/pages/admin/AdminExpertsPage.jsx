import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
  fetchAdminExperts,
  toggleFeaturedExpert,
  suspendAdminExpert,
  unsuspendAdminExpert,
} from '../../api/admin';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import Rating from '../../components/Rating';
import { RowSkeleton } from '../../components/Skeletons';
import { useDebounce } from '../../hooks/useDebounce';
import { SearchIcon, AwardIcon, ArrowRightIcon } from '../../components/Icons';
import { formatPrice } from '../../utils/format';

const AdminExpertsPage = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const debouncedSearch = useDebounce(search, 350);

  const params = { search: debouncedSearch, page, limit: 20 };
  if (filter === 'featured') params.featured = 'true';
  if (filter === 'suspended') params.suspended = 'true';

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'experts', params],
    queryFn: () => fetchAdminExperts(params),
  });

  const experts = data?.data || [];
  const pagination = data?.pagination;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'experts'] });

  const toggleFeatured = useMutation({
    mutationFn: toggleFeaturedExpert,
    onSuccess: (d) => { toast.success(d.featured ? 'Featured on home' : 'Removed from featured'); invalidate(); },
    onError: (e) => toast.error(e?.message || 'Failed'),
  });
  const suspend = useMutation({
    mutationFn: suspendAdminExpert,
    onSuccess: () => { toast.success('Expert hidden from marketplace'); invalidate(); },
    onError: (e) => toast.error(e?.message || 'Failed'),
  });
  const unsuspend = useMutation({
    mutationFn: unsuspendAdminExpert,
    onSuccess: () => { toast.success('Expert restored'); invalidate(); },
    onError: (e) => toast.error(e?.message || 'Failed'),
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Experts</h2>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Feature, hide, or restore expert profiles.
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative w-full sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input type="search" placeholder="Name, category, company" className="input pl-9"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input sm:w-48" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
          <option value="all">All experts</option>
          <option value="featured">Featured only</option>
          <option value="suspended">Suspended only</option>
        </select>
      </div>

      {isLoading ? <RowSkeleton rows={5} />
        : experts.length === 0 ? <EmptyState title="No experts" description="Try a different filter." />
        : (
          <div className="space-y-3">
            {experts.map((e) => (
              <div key={e._id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <Avatar src={e.profileImage} name={e.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="text-base font-semibold text-ink-900 dark:text-white">{e.name}</h3>
                    {e.featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20">
                        <AwardIcon className="h-3 w-3" /> Featured
                      </span>
                    )}
                    {e.isSuspended && (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20">
                        Suspended
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                    {e.category}{e.company && ` · ${e.company}`}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500 dark:text-ink-400">
                    <Rating value={e.rating} />
                    <span>{e.reviewCount} review{e.reviewCount === 1 ? '' : 's'}</span>
                    <span>From {formatPrice(e.price)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                  <button type="button" onClick={() => toggleFeatured.mutate(e._id)}
                    disabled={toggleFeatured.isPending}
                    className="text-ink-700 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white">
                    {e.featured ? 'Unfeature' : 'Feature'}
                  </button>
                  {e.isSuspended ? (
                    <button type="button" onClick={() => unsuspend.mutate(e._id)}
                      disabled={unsuspend.isPending}
                      className="text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
                      Restore
                    </button>
                  ) : (
                    <button type="button" onClick={() => suspend.mutate(e._id)}
                      disabled={suspend.isPending}
                      className="text-red-600 hover:text-red-700 dark:text-red-400">
                      Suspend
                    </button>
                  )}
                  <Link to={`/experts/${e._id}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white">
                    View <ArrowRightIcon className="h-3 w-3" />
                  </Link>
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
    </div>
  );
};

export default AdminExpertsPage;

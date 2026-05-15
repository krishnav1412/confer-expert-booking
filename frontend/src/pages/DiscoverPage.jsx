import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import clsx from 'clsx';

import { fetchExperts } from '../api/experts';
import { useDebounce } from '../hooks/useDebounce';
import ExpertCard from '../components/ExpertCard';
import { ExpertGridSkeleton } from '../components/Skeletons';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { SearchIcon } from '../components/Icons';
import { GlowOrb } from '../components/design-system';
import { Reveal } from '../components/design-system/Motion';

const CATEGORIES = [
  'All', 'Career Mentor', 'Software Engineer', 'UI/UX Expert',
  'AI Consultant', 'Startup Advisor', 'Product Manager',
  'Data Scientist', 'Marketing Expert', 'Fitness Coach',
];

const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'rating', label: 'Top rated' },
  { id: 'experience', label: 'Most experienced' },
  { id: 'priceAsc', label: 'Price: low to high' },
  { id: 'priceDesc', label: 'Price: high to low' },
];

const DiscoverPage = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('featured');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['experts', { search: debouncedSearch, category, page, sort }],
    queryFn: () => fetchExperts({ search: debouncedSearch, category, page, limit: 9, sort }),
    placeholderData: keepPreviousData,
  });

  const experts = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <GlowOrb color="brand" size="lg" className="absolute -right-24 top-0 opacity-15" />

      <div className="container-app relative z-10 py-12 md:py-16">
        <Reveal>
          <p className="ds-caption">Discover</p>
          <h1 className="ds-display-lg mt-3">Find your operator.</h1>
          <p className="ds-subtitle mt-4 max-w-xl">
            Curated experts across product, engineering, design, and growth — book sessions, programs, or subscriptions inside your workspace.
          </p>
        </Reveal>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, role or skill..."
              className="input pl-11 shadow-none dark:border-white/10"
              aria-label="Search experts"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="input sm:w-48 shadow-none dark:border-white/10"
            aria-label="Sort by"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="mt-6 flex flex-nowrap gap-2 overflow-x-auto pb-2 scrollbar-hide sm:flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => { setCategory(cat); setPage(1); }}
              className={clsx(
                'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300',
                category === cat
                  ? 'border-white/20 bg-white/10 text-white ring-1 ring-white/10'
                  : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 dark:border-white/10 dark:bg-white/5 dark:text-ink-300 dark:hover:border-white/20 dark:hover:text-white'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className={clsx('mt-12 transition-opacity duration-300', isFetching && !isLoading && 'opacity-60')}>
          {isLoading ? (
            <ExpertGridSkeleton count={9} />
          ) : isError ? (
            <EmptyState
              title="Couldn't load experts"
              description="Something went wrong on our end."
              action={<button type="button" className="btn-primary" onClick={() => refetch()}>Retry</button>}
            />
          ) : experts.length === 0 ? (
            <EmptyState
              title="No experts found"
              description="Try a different keyword or clear your filters."
              action={
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setSearch(''); setCategory('All'); setPage(1); }}
                >
                  Reset filters
                </button>
              }
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {experts.map((expert, i) => (
                <motion.div
                  key={expert._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.4 }}
                >
                  <ExpertCard expert={expert} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="mt-16 flex justify-center">
            <Pagination page={pagination.page} pages={pagination.pages} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoverPage;

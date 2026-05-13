import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import clsx from 'clsx';

import { fetchExperts, fetchFeaturedExperts, fetchCategories } from '../api/experts';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import ExpertCard from '../components/ExpertCard';
import { ExpertGridSkeleton } from '../components/Skeletons';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import {
  SearchIcon, ArrowRightIcon, AwardIcon, TrendingIcon, CalendarIcon,
  PlayCircleIcon, CheckCircleIcon,
} from '../components/Icons';

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

const HOW_STEPS = [
  { title: 'Browse experts', description: 'Filter by category, search by name or skill, and find the right person for your goal.', icon: SearchIcon },
  { title: 'Pick a service', description: 'Each expert offers structured services with clear pricing, duration, and outcomes.', icon: AwardIcon },
  { title: 'Book instantly', description: 'Pick an open slot, sign in, and your session is locked in. No back-and-forth.', icon: CalendarIcon },
  { title: 'Start your session', description: 'Join the call, get personalised guidance, and walk away with detailed follow-up notes.', icon: PlayCircleIcon },
];

const HomePage = () => {
  const { isAuthenticated, isExpert } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('featured');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 350);

  const { data: featured } = useQuery({
    queryKey: ['experts', 'featured'],
    queryFn: () => fetchFeaturedExperts(4),
    staleTime: 60_000,
  });

  const { data: trending } = useQuery({
    queryKey: ['experts', 'categories'],
    queryFn: fetchCategories,
    staleTime: 60_000,
  });

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['experts', { search: debouncedSearch, category, page, sort }],
    queryFn: () => fetchExperts({ search: debouncedSearch, category, page, limit: 9, sort }),
    placeholderData: keepPreviousData,
  });

  const experts = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-ink-200/70 bg-white dark:border-ink-800/70 dark:bg-ink-950">
        <div className="container-app py-16 sm:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-xs font-medium text-ink-600 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live availability across vetted experts
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl dark:text-white">
              Real conversations
              <br className="hidden sm:block" />
              <span className="text-ink-400 dark:text-ink-500"> with people who've done it.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-500 sm:text-lg dark:text-ink-400">
              Book sessions with India's top mentors, designers, engineers, and founders. Pick a service, lock in a slot, and walk away with answers — not generic advice.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#browse" className="btn-primary">
                Browse experts <ArrowRightIcon className="h-4 w-4" />
              </a>
              {!isAuthenticated && (
                <Link to="/signup" className="btn-secondary">Create free account</Link>
              )}
              {isAuthenticated && !isExpert && (
                <Link to="/become-expert" className="btn-secondary">Become an expert</Link>
              )}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-ink-500 dark:text-ink-400">
              <Stat number="4,500+" label="sessions booked" />
              <Stat number="9" label="expert categories" />
              <Stat number="4.8★" label="average rating" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured experts */}
      {featured && featured.length > 0 && (
        <section className="container-app py-16">
          <div className="flex items-end justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                <AwardIcon className="h-3.5 w-3.5" /> Featured experts
              </span>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl dark:text-white">
                Hand-picked, in demand this week
              </h2>
            </div>
            <a href="#browse" className="hidden items-center gap-1 text-sm font-medium text-ink-700 hover:text-ink-900 sm:inline-flex dark:text-ink-300 dark:hover:text-white">
              See all <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((expert) => <ExpertCard key={expert._id} expert={expert} />)}
          </div>
        </section>
      )}

      {/* Trending categories */}
      {trending && trending.length > 0 && (
        <section className="border-y border-ink-200/70 bg-ink-50/40 py-16 dark:border-ink-800/70 dark:bg-ink-900/30">
          <div className="container-app">
            <div className="flex items-end justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                  <TrendingIcon className="h-3.5 w-3.5" /> Trending categories
                </span>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl dark:text-white">
                  Find an expert by what you need
                </h2>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {trending.slice(0, 9).map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => {
                    setCategory(cat.name); setPage(1);
                    document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="card group flex items-center justify-between p-5 text-left transition-all hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-card-hover dark:hover:border-ink-700"
                >
                  <div>
                    <h3 className="text-base font-semibold text-ink-900 dark:text-white">{cat.name}</h3>
                    <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                      {cat.count} expert{cat.count === 1 ? '' : 's'}{cat.avgRating > 0 && ` · ${cat.avgRating} avg rating`}
                    </p>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-ink-400 transition-transform group-hover:translate-x-1 group-hover:text-ink-700 dark:group-hover:text-white" />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How Confer works */}
      <section className="container-app py-20">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">How Confer works</span>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl dark:text-white">
            From discovery to a confirmed session in minutes
          </h2>
          <p className="mt-3 text-base text-ink-500 dark:text-ink-400">
            No back-and-forth scheduling, no follow-up emails. Pick the person, the service, and the time — that's it.
          </p>
        </div>
        <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {HOW_STEPS.map((step, i) => (
            <li key={step.title} className="card flex h-full flex-col p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-xs font-medium text-ink-400 dark:text-ink-500">
                  Step {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink-900 dark:text-white">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Browse / filter */}
      <section id="browse" className="container-app pb-16 pt-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Browse all experts</h2>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              {pagination?.total ? `${pagination.total} expert${pagination.total === 1 ? '' : 's'} available` : 'Filter by category or search by name'}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative w-full sm:w-72">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input type="search" value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name, company or skill" className="input pl-9"
                aria-label="Search experts" />
            </div>
            <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="input sm:w-48" aria-label="Sort by">
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6 -mx-1 flex flex-nowrap gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
          {CATEGORIES.map((cat) => (
            <button key={cat} type="button" onClick={() => { setCategory(cat); setPage(1); }}
              className={clsx(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                category === cat
                  ? 'border-ink-900 bg-ink-900 text-white dark:border-white dark:bg-white dark:text-ink-900'
                  : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:text-ink-900 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300 dark:hover:border-ink-700 dark:hover:text-white'
              )}>
              {cat}
            </button>
          ))}
        </div>

        <div className={clsx('mt-8', isFetching && !isLoading && 'opacity-70 transition-opacity')}>
          {isLoading ? <ExpertGridSkeleton count={9} />
            : isError ? (
              <EmptyState title="Couldn't load experts" description="Something went wrong on our end."
                action={<button type="button" className="btn-primary" onClick={() => refetch()}>Retry</button>} />
            ) : experts.length === 0 ? (
              <EmptyState title="No experts found" description="Try a different keyword or clear your filters."
                action={<button type="button" className="btn-secondary"
                  onClick={() => { setSearch(''); setCategory('All'); setPage(1); }}>Reset filters</button>} />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {experts.map((expert) => <ExpertCard key={expert._id} expert={expert} />)}
              </div>
            )}
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="mt-10">
            <Pagination page={pagination.page} pages={pagination.pages} onChange={setPage} />
          </div>
        )}
      </section>

      {/* CTA strip */}
      {!isExpert && (
        <section className="border-t border-ink-200/70 bg-ink-50/60 dark:border-ink-800/70 dark:bg-ink-900/40">
          <div className="container-app py-14">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="max-w-xl">
                <h3 className="font-display text-xl font-bold tracking-tight text-ink-900 sm:text-2xl dark:text-white">
                  Have expertise worth sharing?
                </h3>
                <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
                  Join Confer as an expert. Set your own services, pricing, and availability — and get matched with people who actually want your help.
                </p>
                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-600 dark:text-ink-300">
                  <ListItem>Keep up to 90% of session revenue</ListItem>
                  <ListItem>Vetted, serious clients only</ListItem>
                  <ListItem>Tools that respect your time</ListItem>
                </ul>
              </div>
              <Link to="/become-expert" className="btn-primary shrink-0">
                Apply now <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const Stat = ({ number, label }) => (
  <div>
    <div className="font-display text-2xl font-bold text-ink-900 dark:text-white">{number}</div>
    <div className="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">{label}</div>
  </div>
);

const ListItem = ({ children }) => (
  <li className="inline-flex items-center gap-1.5">
    <CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />{children}
  </li>
);

export default HomePage;

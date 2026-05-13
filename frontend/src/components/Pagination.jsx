import clsx from 'clsx';
import { ArrowLeftIcon, ArrowRightIcon } from './Icons';

const Pagination = ({ page, pages, onChange }) => {
  if (pages <= 1) return null;

  const buildRange = () => {
    const range = [];
    const max = pages;
    const cur = page;
    const add = (n) => range.push(n);

    add(1);
    if (cur - 2 > 2) range.push('...');
    for (let i = Math.max(2, cur - 1); i <= Math.min(max - 1, cur + 1); i += 1) add(i);
    if (cur + 2 < max - 1) range.push('...');
    if (max > 1) add(max);
    return range;
  };

  const items = buildRange();

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="grid h-9 w-9 place-items-center rounded-md border border-ink-200 bg-white text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:border-ink-600 dark:hover:text-white"
        aria-label="Previous page"
      >
        <ArrowLeftIcon className="h-4 w-4" />
      </button>
      {items.map((it, idx) =>
        it === '...' ? (
          <span key={`e-${idx}`} className="px-1.5 text-sm text-ink-400">
            …
          </span>
        ) : (
          <button
            key={it}
            type="button"
            onClick={() => onChange(it)}
            className={clsx(
              'h-9 min-w-9 rounded-md px-2.5 text-sm font-medium transition-colors',
              it === page
                ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                : 'border border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:text-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:border-ink-600 dark:hover:text-white'
            )}
          >
            {it}
          </button>
        )
      )}
      <button
        type="button"
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
        className="grid h-9 w-9 place-items-center rounded-md border border-ink-200 bg-white text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:border-ink-600 dark:hover:text-white"
        aria-label="Next page"
      >
        <ArrowRightIcon className="h-4 w-4" />
      </button>
    </nav>
  );
};

export default Pagination;

import clsx from 'clsx';

const variants = {
  neutral: 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200',
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
};

const Badge = ({ children, variant = 'neutral', className = '', dot = false }) => {
  return (
    <span className={clsx('badge', variants[variant], className)}>
      {dot && (
        <span
          className={clsx(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-emerald-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'info' && 'bg-sky-500',
            variant === 'brand' && 'bg-brand-500',
            variant === 'neutral' && 'bg-ink-400'
          )}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;

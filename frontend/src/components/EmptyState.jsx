import { InboxIcon } from './Icons';

const EmptyState = ({
  icon: Icon = InboxIcon,
  title = 'Nothing here yet',
  description = '',
  action = null,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-200 bg-white px-6 py-16 text-center dark:border-ink-800 dark:bg-ink-900/50">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-ink-500 dark:text-ink-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export default EmptyState;

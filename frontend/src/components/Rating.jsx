import { StarIcon } from './Icons';

const Rating = ({ value = 0, showValue = true, size = 'sm', className = '' }) => {
  const sizeClass = size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <StarIcon filled className={`${sizeClass} text-amber-500`} />
      {showValue && (
        <span className="text-sm font-medium text-ink-700 dark:text-ink-200">
          {value.toFixed(1)}
        </span>
      )}
    </span>
  );
};

export default Rating;

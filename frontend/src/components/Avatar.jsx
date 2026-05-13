import { useState } from 'react';
import clsx from 'clsx';

const sizeMap = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-base',
  xl: 'h-24 w-24 text-xl',
};

const Avatar = ({ src, name = '', size = 'md', className = '' }) => {
  const [error, setError] = useState(false);
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');

  return (
    <div
      className={clsx(
        'relative shrink-0 overflow-hidden rounded-full bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
        sizeMap[size],
        className
      )}
    >
      {src && !error ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-semibold">
          {initials || '—'}
        </span>
      )}
    </div>
  );
};

export default Avatar;

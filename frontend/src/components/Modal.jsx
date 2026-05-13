import { useEffect } from 'react';
import { XIcon } from './Icons';

const Modal = ({ open, onClose, title, description, children, size = 'md' }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-4 py-6 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full ${widths[size]} animate-fade-in rounded-2xl border border-ink-200 bg-white shadow-2xl dark:border-ink-800 dark:bg-ink-900`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-4 dark:border-ink-800">
          <div>
            <h2 id="modal-title" className="text-base font-semibold text-ink-900 dark:text-white">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-white"
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

export default Modal;

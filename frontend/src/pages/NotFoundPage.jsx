import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '../components/Icons';

const NotFoundPage = () => (
  <div className="container-app flex min-h-[60vh] items-center justify-center py-16">
    <div className="max-w-md text-center">
      <p className="font-mono text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
        Error 404
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink-900 dark:text-white">
        Page not found
      </h1>
      <p className="mt-3 text-base text-ink-500 dark:text-ink-400">
        The page you're looking for doesn't exist or has moved. Let's get you back on track.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/" className="btn-primary">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to home
        </Link>
        <Link to="/bookings" className="btn-secondary">
          View bookings
        </Link>
      </div>
    </div>
  </div>
);

export default NotFoundPage;

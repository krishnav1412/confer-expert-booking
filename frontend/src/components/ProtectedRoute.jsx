import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FullScreenLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="flex items-center gap-3 text-sm text-ink-500 dark:text-ink-400">
      <span className="h-2 w-2 animate-pulse rounded-full bg-ink-500" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-ink-500" style={{ animationDelay: '120ms' }} />
      <span className="h-2 w-2 animate-pulse rounded-full bg-ink-500" style={{ animationDelay: '240ms' }} />
    </div>
  </div>
);

const ProtectedRoute = ({ require = 'authenticated' }) => {
  const { isAuthenticated, isLoading, isExpert, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullScreenLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (require === 'expert' && !isExpert) {
    return <Navigate to="/become-expert" replace />;
  }
  if (require === 'admin' && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

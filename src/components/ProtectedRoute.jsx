import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-6 h-6 border-2 border-neutral-300 dark:border-slate-700 border-t-neutral-800 dark:border-t-slate-200 rounded-full animate-spin" />
        <p className="text-xs text-neutral-400 dark:text-slate-400">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

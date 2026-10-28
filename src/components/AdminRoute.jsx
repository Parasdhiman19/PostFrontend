import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard component for admin-only pages.
 * Displays a styled 403 Access Denied state if the user is not staff/admin.
 */
export default function AdminRoute({ children }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-24 flex flex-col items-center justify-center gap-3 animate-fadeIn">
        <div className="w-6 h-6 border-2 border-neutral-300 dark:border-slate-700 border-t-neutral-900 dark:border-t-slate-200 rounded-full animate-spin" />
        <span className="text-xs text-neutral-400 dark:text-slate-400">Verifying administrative permissions...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user?.is_staff) {
    return (
      <div className="w-full max-w-lg mx-auto py-16 px-4 animate-fadeIn">
        <div className="bg-white dark:bg-[#1f242d] rounded-2xl border border-neutral-200/90 dark:border-slate-700 p-8 text-center space-y-5 shadow-xs">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-slate-200 border border-neutral-200 dark:border-slate-700">
            <LockShieldIcon className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/50">
              403 • Administrator Access Required
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-slate-100 pt-2">
              Access Restricted
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              The Publication Insights dashboard contains operational metrics and is strictly reserved for platform administrators.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 shadow-2xs cursor-pointer"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Return to Feed</span>
            </Link>

            {!isAuthenticated && (
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-medium px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-[#1a1f27] hover:bg-neutral-50 dark:hover:bg-slate-800 text-neutral-700 dark:text-slate-200 transition-all duration-200 cursor-pointer"
              >
                Sign In with Admin Account
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return children;
}

function LockShieldIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function ArrowLeftIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

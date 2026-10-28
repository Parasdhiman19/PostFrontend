import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="w-full max-w-md mx-auto py-16 text-center space-y-4 animate-fadeIn">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 mb-2 font-mono font-bold text-lg border border-neutral-200 dark:border-slate-700">
        404
      </div>
      <h1 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-slate-100">
        Page Not Found
      </h1>
      <p className="text-xs text-neutral-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
        The page you requested does not exist or may have been moved.
      </p>
      <div className="pt-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 shadow-2xs cursor-pointer"
        >
          Return to Feed
        </Link>
      </div>
    </div>
  );
}

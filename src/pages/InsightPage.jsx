import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getInsights } from '../api/api';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { formatTimeAgo } from '../utils/formatTime';

export default function InsightPage() {
  const { user } = useAuth();
  const [now] = useState(() => Date.now());

  const {
    data: insights,
    isLoading,
    isError,
    error,
    dataUpdatedAt,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-insights'],
    queryFn: getInsights,
    staleTime: 30 * 1000,
    retry: 1,
  });

  const syncElapsedSeconds = dataUpdatedAt
    ? Math.max(0, Math.floor((now - dataUpdatedAt) / 1000))
    : null;
  const syncTimeAgo = syncElapsedSeconds !== null ? formatTimeAgo(syncElapsedSeconds) : 'Just now';

  // If unauthorized or forbidden
  if (isError) {
    const isForbidden = error?.response?.status === 403 || error?.response?.status === 401;
    return (
      <div className="w-full max-w-lg mx-auto py-16 px-4 animate-fadeIn">
        <div className="bg-white dark:bg-[#1f242d] rounded-2xl border border-neutral-200/90 dark:border-slate-700 p-8 text-center space-y-5 shadow-xs">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-slate-200 border border-neutral-200 dark:border-slate-700">
            <LockIcon className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/50">
              {isForbidden ? '403 • Administrator Access Only' : 'Insights Unavailable'}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-slate-100 pt-2">
              {isForbidden ? 'Administrative Privileges Required' : 'Failed to Load Metrics'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {isForbidden
                ? 'Only platform administrators with staff credentials have permission to view publication metrics.'
                : error?.message || 'An error occurred while fetching administrative insights.'}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 shadow-2xs cursor-pointer"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Return to Feed</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const authorsList = insights?.authors || [];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-400 dark:text-slate-400 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-slate-300 px-2 py-0.5 rounded border border-neutral-200 dark:border-slate-700">
              <ShieldCheckIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Admin Portal
            </span>
            <span>•</span>
            <span>Authenticated as @{user?.username}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-950 dark:text-slate-100">
            Publication Insights & Metrics
          </h1>
          <p className="text-xs text-neutral-500 dark:text-slate-400 mt-1">
            Real-time aggregate platform statistics calculated directly from the PostgreSQL / SQLite backend.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-[#1f242d] hover:bg-neutral-50 dark:hover:bg-[#282f3a] text-neutral-800 dark:text-slate-200 cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 shadow-2xs"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{isFetching ? 'Refreshing...' : 'Refresh Metrics'}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-28 bg-neutral-100 dark:bg-slate-800 rounded-xl border border-neutral-200/50 dark:border-slate-700/50" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ─── Primary Metrics Grid (Fluid Responsive Desktop & Mobile) ─ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1f242d] border border-neutral-200/90 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-slate-400 uppercase tracking-wider">
                Total Articles
              </span>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-slate-100">
                {insights?.total_posts ?? 0}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                {insights?.public_posts ?? 0} named • {insights?.anonymous_posts ?? 0} anon
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1f242d] border border-neutral-200/90 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-slate-400 uppercase tracking-wider">
                Anonymous Ratio
              </span>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-slate-100">
                {insights?.anonymous_percentage ?? 0}%
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                {insights?.anonymous_posts ?? 0} anonymous contributions
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1f242d] border border-neutral-200/90 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-slate-400 uppercase tracking-wider">
                Words Written
              </span>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-slate-100">
                {(insights?.total_words ?? 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                ~{insights?.avg_words_per_post ?? 0} words / article
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1f242d] border border-neutral-200/90 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-slate-400 uppercase tracking-wider">
                Catalogue Reading Time
              </span>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-slate-100">
                {insights?.total_reading_time_min ?? 0}m
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-slate-400">Total reading volume</p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1f242d] border border-neutral-200/90 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-slate-400 uppercase tracking-wider">
                Total Comments
              </span>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-slate-100">
                {insights?.total_comments ?? 0}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-slate-400">Community discussion nodes</p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1f242d] border border-neutral-200/90 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-slate-400 uppercase tracking-wider">
                Social Reactions
              </span>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-slate-100">
                {insights?.total_reactions ?? 0}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-slate-400">Likes & dislikes logged</p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1f242d] border border-neutral-200/90 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-slate-400 uppercase tracking-wider">
                Past 24 Hours
              </span>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-slate-100">
                {insights?.past_24h_posts ?? 0}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-slate-400">Articles published today</p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1f242d] border border-neutral-200/90 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-slate-400 uppercase tracking-wider">
                Past 7 Days
              </span>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-slate-100">
                {insights?.past_week_posts ?? 0}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-slate-400">Weekly publication velocity</p>
            </div>
          </div>

          {/* ─── 2-Column Wide Section: Authors + Security/Privacy ──────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contributor Breakdown */}
            <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#1f242d] border border-neutral-200/90 dark:border-slate-700 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-950 dark:text-slate-100">
                  Author Contributions Breakdown
                </h2>
                <span className="text-[11px] font-mono text-neutral-400 dark:text-slate-400">
                  {authorsList.length} distinct authors
                </span>
              </div>

              {authorsList.length === 0 ? (
                <p className="text-xs text-neutral-400 dark:text-slate-400 py-4 text-center">
                  No author data available.
                </p>
              ) : (
                <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                  {authorsList.map((author) => (
                    <div key={author.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-neutral-800 dark:text-slate-200 flex items-center gap-1.5">
                          {author.name === 'Anonymous' ? (
                            <IncognitoIcon className="w-3.5 h-3.5 text-neutral-500" />
                          ) : (
                            <UserIcon className="w-3.5 h-3.5 text-neutral-500" />
                          )}
                          <span>{author.name}</span>
                        </span>
                        <span className="font-mono text-neutral-500 dark:text-slate-400 text-[11px]">
                          {author.count} {author.count === 1 ? 'post' : 'posts'} ({author.pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neutral-700 dark:bg-slate-300 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(4, author.pct)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Privacy & Cache Architecture */}
            <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#1f242d] border border-neutral-200/90 dark:border-slate-700 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-900 dark:text-slate-100 tracking-tight">
                    Anonymity & Administrative Oversight
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500 dark:text-slate-300 bg-neutral-100 dark:bg-slate-700/80 px-2 py-0.5 rounded border border-neutral-200 dark:border-slate-600">
                    Staff-Only
                  </span>
                </div>

                <p className="text-xs text-neutral-600 dark:text-slate-300 leading-relaxed">
                  Anonymous posts preserve author privacy in public endpoints while maintaining actual relational ownership internally. This enables author post deletion, moderation, and abuse mitigation without public identity exposure.
                </p>

                <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-[#1a1f27] border border-neutral-200/70 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-neutral-700 dark:text-slate-300">
                    <span>Public Anonymous Ratio:</span>
                    <span className="font-mono font-semibold">{insights?.anonymous_percentage ?? 0}%</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-700 dark:text-slate-300">
                    <span>Publicly Credited Posts:</span>
                    <span className="font-mono font-semibold">{insights?.public_posts ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-400 dark:text-slate-400 pt-3 border-t border-neutral-100 dark:border-slate-800">
                <span>Last metric calculation: {syncTimeAgo}</span>
                <Link
                  to="/cache"
                  className="text-neutral-700 dark:text-slate-300 hover:text-neutral-950 dark:hover:text-slate-100 font-medium underline underline-offset-2 cursor-pointer"
                >
                  Inspect TanStack Cache &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LockIcon(props) {
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

function ShieldCheckIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function RefreshIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}

function IncognitoIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.775M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

function UserIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}
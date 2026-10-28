import { useState, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatTimeAgo, formatDuration } from '../utils/formatTime';
import ConfirmDialog from '../components/ConfirmDialog';

const INITIAL_BATCH = 8;
const BATCH_SIZE = 8;

export default function CachePage() {
  const queryClient = useQueryClient();
  const queryCache = queryClient.getQueryCache();

  // Tick state to force re-render on cache updates and every second for countdowns
  const [, setTick] = useState(0);
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    // Subscribe to TanStack QueryCache events
    const unsubscribe = queryCache.subscribe(() => {
      setNow(Date.now());
      setTick((prev) => prev + 1);
    });

    // Pulse timer every second to show real-time staleness transitions
    const interval = setInterval(() => {
      setNow(Date.now());
      setTick((prev) => prev + 1);
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [queryCache]);

  const allQueries = queryCache.getAll();
  const hasMore = visibleCount < allQueries.length;

  // Automatic pagination (infinite scroll observer)
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, allQueries.length));
            setIsLoadingMore(false);
          }, 150);
        }
      },
      {
        root: null,
        rootMargin: '250px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, allQueries.length]);

  const visibleQueries = useMemo(() => {
    return allQueries.slice(0, visibleCount);
  }, [allQueries, visibleCount]);

  const handleInvalidate = (queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  };

  const handleRefetch = (queryKey) => {
    queryClient.refetchQueries({ queryKey });
  };

  const handleRemove = (queryKey) => {
    queryClient.removeQueries({ queryKey });
  };

  const handleInvalidateAll = () => {
    queryClient.invalidateQueries();
  };

  const handleClearCache = () => {
    queryClient.clear();
    setIsClearModalOpen(false);
    setVisibleCount(INITIAL_BATCH);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
            Cache Inspector
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-slate-400 mt-1.5 font-normal">
            Real-time visualizer for TanStack Query v5 cache slots, observers, and transitions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleInvalidateAll}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-[#1f242d] hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-800 dark:text-slate-200 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-90 active:scale-y-80 shadow-2xs cursor-pointer"
          >
            <BoltIcon className="w-3.5 h-3.5" />
            <span>Invalidate All</span>
          </button>
          <button
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-[#1f242d] hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-800 dark:text-slate-200 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-90 active:scale-y-80 shadow-2xs cursor-pointer"
          >
            <TrashIcon className="w-3.5 h-3.5" />
            <span>Clear Cache</span>
          </button>
        </div>
      </div>

      {/* ─── Cache Legend (Classic Minimalist) ────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-2.5 px-3.5 rounded-lg bg-white dark:bg-[#1f242d] border border-neutral-200/90 dark:border-slate-700/80 text-xs text-neutral-600 dark:text-slate-300 shadow-2xs">
        <span className="font-semibold text-neutral-900 dark:text-slate-100">States:</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="font-mono text-[11px] text-neutral-800 dark:text-slate-200 bg-neutral-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-slate-700 font-medium">[fresh]</span>
          <span className="text-neutral-500 dark:text-slate-400 text-[11px]">in memory (0ms)</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="font-mono text-[11px] text-neutral-500 dark:text-slate-400 bg-neutral-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-slate-700">[stale]</span>
          <span className="text-neutral-500 dark:text-slate-400 text-[11px]">expired (refetches)</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="font-mono text-[11px] text-neutral-900 dark:text-slate-100 bg-neutral-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-neutral-300 dark:border-slate-700 font-medium">[fetching]</span>
          <span className="text-neutral-500 dark:text-slate-400 text-[11px]">in flight</span>
        </span>
      </div>

      {/* ─── Query Slots Table ───────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-slate-400 px-0.5">
          <span>Active Memory Slots ({allQueries.length})</span>
        </div>

        {allQueries.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed border-neutral-300 dark:border-slate-800 bg-neutral-50/50 dark:bg-[#1f242d]/50 p-6 space-y-2">
            <p className="text-xs text-neutral-500 dark:text-slate-400">Query cache is currently empty.</p>
            <p className="text-[11px] text-neutral-400 dark:text-slate-500">
              Navigate to the Feed or an article to trigger cache entries.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Structured Table (md and up) - No horizontal scroll */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-neutral-200/90 dark:border-slate-800 bg-white dark:bg-[#1f242d] shadow-2xs">
              <table className="w-full table-fixed text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200/80 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-slate-400 bg-neutral-50/70 dark:bg-[#161b22]/70">
                    <th className="w-[32%] py-3 px-3.5 font-semibold">Query Key</th>
                    <th className="w-[18%] py-3 px-3 font-semibold">Status</th>
                    <th className="w-[9%] py-3 px-2 font-semibold text-center">Obs</th>
                    <th className="w-[20%] py-3 px-3 font-semibold">Data Payload</th>
                    <th className="w-[10%] py-3 px-2 font-semibold">Updated</th>
                    <th className="w-[11%] py-3 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-slate-800/80">
                  {visibleQueries.map((query) => {
                    const queryKey = query.queryKey;
                    const isFetching = query.state.fetchStatus === 'fetching';
                    const isStale = query.isStale();
                    const observersCount = query.getObserversCount();
                    const isInactive = observersCount === 0;

                    const keyString = JSON.stringify(queryKey);
                    const updatedAt = query.state.dataUpdatedAt;
                    const ageSeconds = updatedAt ? Math.floor((now - updatedAt) / 1000) : 0;
                    const staleTimeSeconds = Math.floor((query.options.staleTime || 30000) / 1000);
                    const remainingFresh = Math.max(0, staleTimeSeconds - ageSeconds);

                    const data = query.state.data;
                    let dataSummary = 'No data';
                    if (Array.isArray(data)) {
                      dataSummary = `Array (${data.length} items)`;
                    } else if (data && typeof data === 'object') {
                      dataSummary = data.title ? `Post: "${data.title}"` : 'Object';
                    }

                    return (
                      <tr
                        key={query.queryHash}
                        className="hover:bg-neutral-50/60 dark:hover:bg-[#161b22]/40 transition-colors duration-150"
                      >
                        {/* Query Key */}
                        <td className="py-3 px-3.5">
                          <code
                            className="font-mono text-[11px] font-medium text-neutral-900 dark:text-slate-200 bg-neutral-100/90 dark:bg-[#161b22] px-2 py-0.5 rounded border border-neutral-200/90 dark:border-slate-700/80 truncate block w-full align-middle"
                            title={keyString}
                          >
                            {keyString}
                          </code>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <div className="font-mono text-[11px]">
                            {isFetching ? (
                              <span className="px-2 py-0.5 rounded border border-neutral-300 dark:border-slate-600 bg-neutral-100 dark:bg-slate-800 text-neutral-900 dark:text-slate-100 font-medium animate-pulse inline-block whitespace-nowrap">
                                [fetching]
                              </span>
                            ) : isStale ? (
                              <span className="px-2 py-0.5 rounded border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/40 text-neutral-500 dark:text-slate-400 font-normal inline-block whitespace-nowrap">
                                [stale]
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded border border-neutral-300 dark:border-slate-600 bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-slate-200 font-medium inline-block whitespace-nowrap">
                                [fresh: {formatDuration(remainingFresh)}]
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Observers */}
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[10px] ${
                              isInactive
                                ? 'text-neutral-400 dark:text-slate-500 bg-neutral-50 dark:bg-slate-800/40 border border-neutral-200/60 dark:border-slate-800'
                                : 'text-neutral-800 dark:text-slate-200 font-semibold bg-neutral-100 dark:bg-slate-700/60 border border-neutral-200/80 dark:border-slate-700'
                            }`}
                          >
                            {observersCount} obs
                          </span>
                        </td>

                        {/* Data Payload */}
                        <td className="py-3 px-3 text-neutral-600 dark:text-slate-300 font-mono text-[11px]">
                          <span className="truncate block w-full" title={dataSummary}>
                            {dataSummary}
                          </span>
                        </td>

                        {/* Updated */}
                        <td className="py-3 px-2 text-neutral-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                          {formatTimeAgo(ageSeconds)}
                        </td>

                        {/* Actions - Compact icons fitting cleanly within column */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleInvalidate(queryKey)}
                              title="Mark query as stale (Invalidate)"
                              className="p-1.5 rounded-lg text-neutral-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-all duration-150 active:scale-85 cursor-pointer"
                            >
                              <BoltIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRefetch(queryKey)}
                              title="Force refetch in background"
                              className="p-1.5 rounded-lg text-neutral-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-all duration-150 active:scale-85 cursor-pointer"
                            >
                              <RefreshIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemove(queryKey)}
                              title="Remove query from memory cache"
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-150 active:scale-85 cursor-pointer"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View Styled Like the Post Table/Stream (under md) */}
            <div className="block md:hidden divide-y divide-neutral-200/80 dark:divide-slate-800 overflow-hidden">
              {visibleQueries.map((query) => {
                const queryKey = query.queryKey;
                const isFetching = query.state.fetchStatus === 'fetching';
                const isStale = query.isStale();
                const observersCount = query.getObserversCount();
                const isInactive = observersCount === 0;

                const keyString = JSON.stringify(queryKey);
                const updatedAt = query.state.dataUpdatedAt;
                const ageSeconds = updatedAt ? Math.floor((now - updatedAt) / 1000) : 0;
                const staleTimeSeconds = Math.floor((query.options.staleTime || 30000) / 1000);
                const remainingFresh = Math.max(0, staleTimeSeconds - ageSeconds);

                const data = query.state.data;
                let dataSummary = 'No data';
                if (Array.isArray(data)) {
                  dataSummary = `Array (${data.length} items)`;
                } else if (data && typeof data === 'object') {
                  dataSummary = data.title ? `Post: "${data.title}"` : 'Object';
                }

                return (
                  <article
                    key={query.queryHash}
                    className="py-5 first:pt-1 last:pb-0 space-y-2.5 group transition-colors"
                  >
                    {/* Top Meta Header - Matching Post Meta Style */}
                    <div className="flex items-center justify-between text-xs text-neutral-400 dark:text-slate-400 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isFetching ? (
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] border border-neutral-300 dark:border-slate-600 bg-neutral-100 dark:bg-slate-800 text-neutral-900 dark:text-slate-100 font-medium animate-pulse inline-block">
                            [fetching]
                          </span>
                        ) : isStale ? (
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/40 text-neutral-500 dark:text-slate-400 font-normal inline-block">
                            [stale]
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] border border-neutral-300 dark:border-slate-600 bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-slate-200 font-medium inline-block">
                            [fresh: {formatDuration(remainingFresh)}]
                          </span>
                        )}
                        <span>•</span>
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                            isInactive
                              ? 'text-neutral-400 dark:text-slate-500 bg-neutral-50 dark:bg-slate-800/40 border border-neutral-200/60 dark:border-slate-800'
                              : 'text-neutral-800 dark:text-slate-200 font-semibold bg-neutral-100 dark:bg-slate-700/60 border border-neutral-200/80 dark:border-slate-700'
                          }`}
                        >
                          {observersCount} obs
                        </span>
                        <span>•</span>
                        <time className="text-[11px] text-neutral-400 dark:text-slate-400">
                          {formatTimeAgo(ageSeconds)}
                        </time>
                      </div>
                    </div>

                    {/* Query Key - Matching Post Title Header */}
                    <div>
                      <code className="font-mono text-xs sm:text-sm font-semibold text-neutral-950 dark:text-slate-100 bg-neutral-100/90 dark:bg-[#161b22] px-2.5 py-1.5 rounded-lg border border-neutral-200/90 dark:border-slate-700/80 break-all leading-normal inline-block max-w-full">
                        {keyString}
                      </code>
                    </div>

                    {/* Excerpt & Actions Footer Row */}
                    <div className="pt-0.5 flex items-center justify-between gap-3">
                      <p className="text-xs text-neutral-600 dark:text-slate-400 font-mono truncate min-w-0 flex-1">
                        Payload: <span className="text-neutral-800 dark:text-slate-200 font-medium">{dataSummary}</span>
                      </p>

                      {/* Actions - Compact icons matching PC view */}
                      <div className="flex items-center justify-end gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleInvalidate(queryKey)}
                          title="Mark query as stale (Invalidate)"
                          className="p-1.5 rounded-lg text-neutral-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-all duration-150 active:scale-85 cursor-pointer"
                        >
                          <BoltIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRefetch(queryKey)}
                          title="Force refetch in background"
                          className="p-1.5 rounded-lg text-neutral-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-all duration-150 active:scale-85 cursor-pointer"
                        >
                          <RefreshIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(queryKey)}
                          title="Remove query from memory cache"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-150 active:scale-85 cursor-pointer"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Automatic Pagination Sentinel for Cache Slots */}
            {hasMore && (
              <div
                ref={sentinelRef}
                className="py-6 flex flex-col items-center justify-center gap-2 text-neutral-400 dark:text-slate-500"
              >
                <div className="w-5 h-5 border-2 border-neutral-300 dark:border-slate-700 border-t-neutral-900 dark:border-t-slate-200 rounded-full animate-spin" />
                <span className="text-[11px] font-mono tracking-tight">
                  {isLoadingMore ? 'Loading next slots...' : 'Scroll for more memory slots'}
                </span>
              </div>
            )}

            {!hasMore && allQueries.length > INITIAL_BATCH && (
              <div className="py-6 text-center text-xs text-neutral-400 dark:text-slate-500 border-t border-neutral-200/60 dark:border-slate-800/80">
                <span>All cached memory slots are loaded</span>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearCache}
        title="Purge Query Cache?"
        message="Are you sure you want to purge all active query cache slots? Active components will immediately re-fetch live data from the backend server."
        confirmText="Purge Cache"
        confirmVariant="danger"
      />
    </div>
  );
}

function BoltIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
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

function TrashIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}
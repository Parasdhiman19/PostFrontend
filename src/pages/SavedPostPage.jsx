import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { usePosts } from '../api/usePosts';
import { useSavedPosts } from '../api/useSavedPosts';
import { formatTimeAgo } from '../utils/formatTime';
import { stripMarkdown } from '../utils/editorUtils';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';

const INITIAL_BATCH = 6;
const BATCH_SIZE = 6;

export default function SavedPostPage() {
  const { data: allPosts, isLoading } = usePosts();
  const { savedIds, removeSaved, clearAllSaved } = useSavedPosts();
  const { success } = useToast();
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [now] = useState(() => Date.now());
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const sentinelRef = useRef(null);

  // Filter posts that are currently saved
  const savedPosts = useMemo(() => {
    return (allPosts || []).filter((post) =>
      savedIds.some((id) => String(id) === String(post.id))
    );
  }, [allPosts, savedIds]);

  const hasMore = visibleCount < savedPosts.length;

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
            setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, savedPosts.length));
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
  }, [hasMore, savedPosts.length]);

  const visiblePosts = useMemo(() => {
    return savedPosts.slice(0, visibleCount);
  }, [savedPosts, visibleCount]);

  const handleConfirmClear = () => {
    clearAllSaved();
    setIsClearModalOpen(false);
    setVisibleCount(INITIAL_BATCH);
    success('All saved articles have been removed from your reading list.');
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
            Saved Articles
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-slate-400 mt-1.5 font-normal">
            Your personal reading queue preserved in your browser.
          </p>
        </div>

        {savedPosts.length > 0 && (
          <button
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 cursor-pointer transition-colors px-3 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#1f242d] self-start sm:self-auto"
          >
            <TrashIcon className="w-3.5 h-3.5" />
            <span>Clear reading list</span>
          </button>
        )}
      </div>

      {/* ─── Loading State ──────────────────────────────────────────── */}
      {isLoading && (
        <div className="divide-y divide-neutral-200/70 dark:divide-slate-800/80">
          {[1, 2, 3].map((n) => (
            <div key={n} className="py-7 first:pt-2 last:pb-0 space-y-3 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-24 h-3.5 bg-neutral-200 dark:bg-slate-800 rounded" />
                <div className="w-16 h-3.5 bg-neutral-100 dark:bg-slate-800/60 rounded" />
              </div>
              <div className="h-6 bg-neutral-200 dark:bg-slate-800 rounded w-4/5" />
              <div className="space-y-1.5 pt-1">
                <div className="h-4 bg-neutral-100 dark:bg-slate-800/60 rounded w-full" />
                <div className="h-4 bg-neutral-100 dark:bg-slate-800/60 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Empty State (Clean, Simple & Unboxed) ────────────────── */}
      {!isLoading && savedPosts.length === 0 && (
        <div className="py-16 sm:py-24 text-center max-w-sm mx-auto space-y-3 animate-fadeIn">
          <div className="w-10 h-10 mx-auto rounded-full bg-neutral-100 dark:bg-slate-800 flex items-center justify-center text-neutral-400 dark:text-slate-400">
            <BookmarkIcon className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-slate-100">
              No saved articles
            </h2>
            <p className="text-xs text-neutral-500 dark:text-slate-400 leading-relaxed">
              Bookmark articles while reading to build your personal reading list.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs font-medium text-neutral-900 dark:text-slate-200 hover:text-neutral-600 dark:hover:text-slate-400 underline underline-offset-4 cursor-pointer transition-colors"
            >
              <span>Explore articles</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      )}

      {/* ─── Single-Column Saved Articles Stream ────────────────────── */}
      {!isLoading && savedPosts.length > 0 && (
        <div className="space-y-4">
          <div className="divide-y divide-neutral-200/80 dark:divide-slate-800">
            {visiblePosts.map((post) => {
              const elapsedSeconds = post.created_at
                ? Math.max(0, Math.floor((now - new Date(post.created_at).getTime()) / 1000))
                : null;
              const timeAgo = elapsedSeconds !== null ? formatTimeAgo(elapsedSeconds) : 'Recently';

              const plainContent = stripMarkdown(post.content || '');
              const plainTitle = stripMarkdown(post.title || '');
              const wordCount = plainContent ? plainContent.split(/\s+/).filter(Boolean).length : 0;
              const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

              return (
                <article
                  key={post.id}
                  className="py-7 sm:py-8 first:pt-1 last:pb-0 group transition-colors"
                >
                  {/* Meta Row */}
                  <div className="flex items-center justify-between text-xs text-neutral-400 dark:text-slate-400 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-neutral-800 dark:text-slate-200 flex items-center gap-1.5">
                        {post.is_anonymous ? (
                          <>
                            <IncognitoIcon className="w-3.5 h-3.5 text-neutral-500 dark:text-slate-400" />
                            <span>Anonymous</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-slate-500" />
                            <span>@{post.author_username || post.author_name || 'author'}</span>
                          </>
                        )}
                      </span>
                      <span>•</span>
                      <time dateTime={post.created_at} title={post.created_at ? new Date(post.created_at).toLocaleString() : ''}>
                        {timeAgo}
                      </time>
                      <span>•</span>
                      <span>{readTimeMin} min read</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeSaved(post.id)}
                      className="group/rm text-neutral-400 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-slate-800 cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-90 inline-flex items-center gap-1.5 text-xs font-medium"
                      title="Remove from saved"
                    >
                      <TrashIcon className="w-3.5 h-3.5 text-neutral-400 group-hover/rm:text-rose-600 dark:text-slate-400 dark:group-hover/rm:text-rose-400 transition-colors" />
                      <span>Remove</span>
                    </button>
                  </div>

                  {/* Title */}
                  <Link to={`/details/${post.id}`} className="block group cursor-pointer">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-slate-100 group-hover:text-neutral-600 dark:group-hover:text-slate-300 transition-colors leading-snug">
                      {plainTitle}
                    </h2>
                  </Link>

                  {/* Excerpt */}
                  <p className="mt-2 text-sm text-neutral-600 dark:text-slate-400 line-clamp-2 sm:line-clamp-3 leading-relaxed font-normal">
                    {plainContent}
                  </p>

                  {/* Bottom Footer Row */}
                  <div className="mt-4 flex items-center justify-between">
                    <Link
                      to={`/details/${post.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-slate-200 hover:text-neutral-600 dark:hover:text-slate-400 cursor-pointer transition-colors"
                    >
                      <span>Read article</span>
                      <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <span className="text-[11px] font-mono text-neutral-400 dark:text-slate-500">
                      Saved in browser
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          {/* ─── Automatic Pagination Loading / End of Stream Sentinel ── */}
          {hasMore && (
            <div
              ref={sentinelRef}
              className="py-8 flex flex-col items-center justify-center gap-2 text-neutral-400 dark:text-slate-500"
            >
              <div className="w-5 h-5 border-2 border-neutral-300 dark:border-slate-700 border-t-neutral-900 dark:border-t-slate-200 rounded-full animate-spin" />
              <span className="text-[11px] font-mono tracking-tight">
                {isLoadingMore ? 'Loading next saved articles...' : 'Scroll to load more'}
              </span>
            </div>
          )}

          {!hasMore && savedPosts.length > INITIAL_BATCH && (
            <div className="py-8 text-center text-xs text-neutral-400 dark:text-slate-500 border-t border-neutral-200/60 dark:border-slate-800/80">
              <span>All saved articles are loaded</span>
            </div>
          )}
        </div>
      )}

      {/* Clear All Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClear}
        title="Clear Reading List?"
        message="Are you sure you want to remove all saved articles from your local reading list? This will not delete the original posts."
        confirmText="Clear Reading List"
        confirmVariant="danger"
      />
    </div>
  );
}

// ─── Lightweight SVG Icons ────────────────────────────────────────────

function BookmarkIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 11.186 0z" />
    </svg>
  );
}

function ArrowRightIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
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

function TrashIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}
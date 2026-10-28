import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { usePosts } from '../api/usePosts';
import { useSavedPosts } from '../api/useSavedPosts';
import { formatTimeAgo } from '../utils/formatTime';
import { stripMarkdown } from '../utils/editorUtils';

const INITIAL_BATCH = 6;
const BATCH_SIZE = 6;

export default function HomePage() {
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'anonymous'
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [now] = useState(() => Date.now());
  const sentinelRef = useRef(null);

  // Track filter and search changes to adjust visibleCount during render (React recommended pattern)
  const [prevFilter, setPrevFilter] = useState(feedFilter);
  const [prevSearch, setPrevSearch] = useState(searchQuery);

  if (feedFilter !== prevFilter || searchQuery !== prevSearch) {
    setPrevFilter(feedFilter);
    setPrevSearch(searchQuery);
    setVisibleCount(INITIAL_BATCH);
  }

  // TanStack Query: fetch with query param ('all' vs 'anonymous')
  const {
    data: posts,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = usePosts({ filter: feedFilter });

  const { isSaved, toggleSave } = useSavedPosts();

  // Filter posts based on search query (title, content, author)
  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    const q = searchQuery.trim().toLowerCase();

    return posts.filter((post) => {
      if (feedFilter === 'anonymous' && !post.is_anonymous) {
        return false;
      }

      if (q) {
        const inTitle = post.title?.toLowerCase().includes(q);
        const inContent = post.content?.toLowerCase().includes(q);
        const postAuthor = post.is_anonymous
          ? 'anonymous'
          : (post.author_username || post.author_name || '').toLowerCase();
        const inAuthor = postAuthor.includes(q);
        return inTitle || inContent || inAuthor;
      }

      return true;
    });
  }, [posts, searchQuery, feedFilter]);

  const hasMore = visibleCount < filteredPosts.length;

  // Automatic pagination (infinite scroll observer)
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore) {
          setIsLoadingMore(true);
          // Smooth micro-delay for natural feed progression
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredPosts.length));
            setIsLoadingMore(false);
          }, 150);
        }
      },
      {
        root: null,
        rootMargin: '250px', // Trigger automatically before user hits bottom
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, filteredPosts.length]);

  const visiblePosts = useMemo(() => {
    return filteredPosts.slice(0, visibleCount);
  }, [filteredPosts, visibleCount]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* ─── Header Context & Write Post CTA ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-neutral-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
            Articles
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-slate-400 mt-1.5 font-normal">
            Thoughts, technical blueprints, and engineering notes.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isFetching && !isLoading && (
            <span className="text-[11px] font-mono text-neutral-400 dark:text-slate-400 animate-pulse">
              Syncing...
            </span>
          )}
          <Link
            to="/create"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 shadow-2xs"
          >
            <WriteIcon className="w-3.5 h-3.5" />
            <span>Write Post</span>
          </Link>
        </div>
      </div>

      {/* ─── Controls Bar: Two Clear Choices & Search ───────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Exactly Two Primary Filter Choices */}
        <div className="inline-flex p-1 bg-neutral-100 dark:bg-[#1a1f27] rounded-xl border border-neutral-200/80 dark:border-slate-800 text-xs self-start sm:self-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFeedFilter('all')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
              feedFilter === 'all'
                ? 'bg-white dark:bg-[#1f242d] text-neutral-950 dark:text-slate-100 shadow-2xs font-semibold'
                : 'text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-200'
            }`}
          >
            <ArticlesIcon className="w-3.5 h-3.5" />
            <span>All Posts</span>
          </button>

          <button
            type="button"
            onClick={() => setFeedFilter('anonymous')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
              feedFilter === 'anonymous'
                ? 'bg-white dark:bg-[#1f242d] text-neutral-950 dark:text-slate-100 shadow-2xs font-semibold'
                : 'text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-200'
            }`}
          >
            <IncognitoIcon className="w-3.5 h-3.5" />
            <span>Anonymous Posts</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <SearchIcon className="w-4 h-4 text-neutral-400 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-[#1a1f27] placeholder:text-neutral-400 dark:placeholder:text-slate-500 text-neutral-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:text-slate-400 dark:hover:text-slate-200 p-0.5 cursor-pointer transition-transform active:scale-90"
              title="Clear search"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Loading Skeletons ───────────────────────────────────────── */}
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

      {/* ─── Error State ────────────────────────────────────────────── */}
      {isError && (
        <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 space-y-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-rose-800 dark:text-rose-300">
            <AlertCircleIcon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Failed to load articles</span>
          </div>
          <p className="text-rose-700 dark:text-rose-300/90">
            {error?.message || 'Could not connect to the backend server.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-xs font-semibold px-3.5 py-1.5 bg-rose-600 dark:bg-rose-700 text-white rounded-lg hover:bg-rose-700 dark:hover:bg-rose-600 cursor-pointer transition-all active:scale-95"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ─── Empty State: No Posts At All ────────────────────────────── */}
      {!isLoading && !isError && (!posts || posts.length === 0) && (
        <div className="py-20 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-slate-800 bg-neutral-50/50 dark:bg-[#1f242d]/30 p-8 space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-neutral-200/70 dark:bg-slate-800 text-neutral-600 dark:text-slate-400">
            <DocumentIcon className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-neutral-950 dark:text-slate-100">
            {feedFilter === 'anonymous' ? 'No anonymous posts published yet' : 'No articles published yet'}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-slate-400 max-w-sm mx-auto">
            {feedFilter === 'anonymous'
              ? 'Articles written with the "Post anonymously" visibility setting will appear here.'
              : 'Be the first to publish an engineering note, idea, or architectural insight.'}
          </p>
          <div className="pt-2">
            <Link
              to="/create"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-neutral-800 dark:hover:bg-white cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 shadow-2xs"
            >
              <WriteIcon className="w-3.5 h-3.5" />
              <span>Create First Post</span>
            </Link>
          </div>
        </div>
      )}

      {/* ─── Empty State: No Search Match ────────────────────────────── */}
      {!isLoading && !isError && posts && posts.length > 0 && filteredPosts.length === 0 && (
        <div className="py-16 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-slate-800 bg-white dark:bg-[#1f242d]/30 p-8 space-y-2">
          <p className="text-sm font-semibold text-neutral-900 dark:text-slate-200">No matching articles found</p>
          <p className="text-xs text-neutral-400 dark:text-slate-400 max-w-xs mx-auto">
            Try searching with different keywords or switch between All Posts and Anonymous Posts.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFeedFilter('all');
              }}
              className="text-xs text-neutral-800 dark:text-slate-300 hover:underline font-semibold cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* ─── Single-Column Editorial Article Stream ────────────────── */}
      {!isLoading && !isError && filteredPosts.length > 0 && (
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
              const bookmarked = isSaved(post.id);

              return (
                <article
                  key={post.id}
                  className="py-7 sm:py-8 first:pt-1 last:pb-0 group transition-colors"
                >
                  {/* Top Meta Header */}
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

                    {/* Bookmark Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleSave(post.id)}
                      className="text-neutral-400 hover:text-neutral-900 dark:text-slate-400 dark:hover:text-slate-100 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-slate-800 cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-80"
                      title={bookmarked ? 'Remove from saved' : 'Save for later'}
                    >
                      {bookmarked ? (
                        <BookmarkSolidIcon className="w-4 h-4 text-neutral-900 dark:text-slate-100" />
                      ) : (
                        <BookmarkIcon className="w-4 h-4" />
                      )}
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

                    {/* Social Reaction Counters */}
                    <div className="flex items-center gap-3.5 text-xs text-neutral-400 dark:text-slate-400 font-mono">
                      <span className="inline-flex items-center gap-1" title={`${post.likes_count || 0} likes`}>
                        <ThumbsUpMiniIcon className="w-3.5 h-3.5" />
                        <span>{post.likes_count || 0}</span>
                      </span>
                      <span className="inline-flex items-center gap-1" title={`${post.dislikes_count || 0} dislikes`}>
                        <ThumbsDownMiniIcon className="w-3.5 h-3.5" />
                        <span>{post.dislikes_count || 0}</span>
                      </span>
                      <span className="inline-flex items-center gap-1" title={`${post.comments_count || 0} comments`}>
                        <ChatMiniIcon className="w-3.5 h-3.5" />
                        <span>{post.comments_count || 0}</span>
                      </span>
                    </div>
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
                {isLoadingMore ? 'Loading next articles...' : 'Scroll to load more'}
              </span>
            </div>
          )}

          {!hasMore && filteredPosts.length > INITIAL_BATCH && (
            <div className="py-8 text-center text-xs text-neutral-400 dark:text-slate-500 border-t border-neutral-200/60 dark:border-slate-800/80">
              <span>All articles are loaded</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Lightweight SVG Icons ────────────────────────────────────────────

function ArticlesIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
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

function WriteIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}

function SearchIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function CloseIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function BookmarkIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 11.186 0z" />
    </svg>
  );
}

function BookmarkSolidIcon(props) {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.58A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
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

function DocumentIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function AlertCircleIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
  );
}

function ThumbsUpMiniIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.25A2.25 2.25 0 0 1 3 16.5v-4.5A2.25 2.25 0 0 1 5.25 9.75h1.383Z" />
    </svg>
  );
}

function ThumbsDownMiniIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016c.483 0 .964.078 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h2.27A2.25 2.25 0 0 1 21 7.75v4.5a2.25 2.25 0 0 1-2.25 2.25h-1.383c-.806 0-1.533.446-2.031 1.08a9.041 9.041 0 0 1-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 0 0-.322 1.672v.632a.75.75 0 0 1-.75.75 2.25 2.25 0 0 1-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H7.498Z" />
    </svg>
  );
}

function ChatMiniIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-.974-.948 4.024 4.024 0 0 0 .538-2.016A7.476 7.476 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  );
}
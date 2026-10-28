import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { usePost } from '../api/usePost';
import { useDeletePost } from '../api/useDeletePost';
import { useSavedPosts } from '../api/useSavedPosts';
import { formatTimeAgo } from '../utils/formatTime';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import EditPostModal from '../components/EditPostModal';
import ReactionButtons from '../components/ReactionButtons';
import ThreadedComments from '../components/ThreadedComments';
import MarkdownRenderer from '../components/MarkdownRenderer';

export default function PostDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [now] = useState(() => Date.now());

  const { data: post, isLoading, isError, error } = usePost(id);
  const { isSaved, toggleSave } = useSavedPosts();

  // Modals state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Delete Mutation
  const { mutate: deletePostMutation, isPending: isDeleting } = useDeletePost({
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      navigate('/');
    },
  });

  const handleDeleteConfirm = () => {
    if (!id || isDeleting) return;
    deletePostMutation(id);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 bg-neutral-200 dark:bg-slate-700/60 rounded w-1/6" />
        <div className="h-10 bg-neutral-200 dark:bg-slate-700/60 rounded w-2/3" />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-slate-700/60" />
          <div className="h-3 bg-neutral-200 dark:bg-slate-700/60 rounded w-1/4" />
        </div>
        <div className="h-64 bg-neutral-200 dark:bg-slate-700/60 rounded-2xl w-full mt-6" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="w-full max-w-lg mx-auto py-16 text-center space-y-4 animate-fadeIn">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 mb-2">
          <AlertCircleIcon className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-slate-100">Post Not Found</h2>
        <p className="text-xs text-neutral-500 dark:text-slate-400 max-w-sm mx-auto">
          {error?.response?.status === 404
            ? "The post you're looking for doesn't exist or has been removed."
            : error?.message || 'Unable to load post details.'}
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-neutral-800 dark:hover:bg-white cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 shadow-2xs"
          >
            Return to Feed
          </Link>
        </div>
      </div>
    );
  }

  const wordCount = post.content ? post.content.split(/\s+/).filter(Boolean).length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  const elapsedSeconds = post.created_at
    ? Math.max(0, Math.floor((now - new Date(post.created_at).getTime()) / 1000))
    : null;
  const timeAgo = elapsedSeconds !== null ? formatTimeAgo(elapsedSeconds) : 'Recently';

  const formattedFullDate = post.created_at
    ? new Date(post.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  const bookmarked = isSaved(post.id);

  return (
    <>
      <div className="w-full max-w-6xl mx-auto animate-fadeIn">
        
        {/* ─── Responsive Grid: Article Content (8 cols) + Sticky Context Sidebar (4 cols) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Main Article Body Column */}
          <article className="lg:col-span-8 space-y-7">
            {/* Top Navigation & Mobile Actions */}
            <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-slate-800 pb-4">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-100 cursor-pointer transition-colors"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                <span>Articles</span>
              </Link>

              {/* Mobile Only Action Buttons (Shown on screens < lg) */}
              <div className="flex lg:hidden items-center gap-1 sm:gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleSave(post.id)}
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 sm:px-2.5 py-1.5 rounded-lg border cursor-pointer shrink-0 whitespace-nowrap transition-all ${
                    bookmarked
                      ? 'border-neutral-300 dark:border-slate-600 bg-neutral-100 dark:bg-slate-700 text-neutral-950 dark:text-slate-100 font-semibold'
                      : 'border-neutral-200 dark:border-slate-700 bg-white dark:bg-[#1f242d] text-neutral-700 dark:text-slate-200'
                  }`}
                  title={bookmarked ? 'Remove from saved' : 'Save for later'}
                >
                  {bookmarked ? (
                    <BookmarkSolidIcon className="w-3.5 h-3.5 text-neutral-950 dark:text-slate-100" />
                  ) : (
                    <BookmarkIcon className="w-3.5 h-3.5" />
                  )}
                  <span>{bookmarked ? 'Saved' : 'Save'}</span>
                </button>

                {post.is_author && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-neutral-700 dark:text-slate-200 px-2 sm:px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-[#1f242d] cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <EditIcon className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400 px-2 sm:px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-[#1f242d] cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Article Header */}
            <header className="space-y-3.5">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-950 dark:text-white leading-[1.18] break-words">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-neutral-500 dark:text-slate-400 font-normal">
                <span className="font-semibold text-neutral-900 dark:text-slate-200 flex items-center gap-1.5">
                  {post.is_anonymous ? (
                    <>
                      <IncognitoIcon className="w-3.5 h-3.5 text-neutral-500 dark:text-slate-400" />
                      <span>Anonymous</span>
                    </>
                  ) : (
                    <span>@{post.author_username || post.author_name || 'author'}</span>
                  )}
                </span>
                <span>•</span>
                <time dateTime={post.created_at} title={formattedFullDate}>
                  {timeAgo}
                </time>
                <span>•</span>
                <span>{readTimeMin} min read</span>
              </div>
            </header>

            {/* Formatted Article Body */}
            <div className="pt-4 border-t border-neutral-200/60 dark:border-slate-800 text-sm sm:text-base leading-relaxed">
              <MarkdownRenderer content={post.content} />
            </div>

            {/* Social Reactions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-neutral-200/80 dark:border-slate-800">
              <ReactionButtons
                postId={post.id}
                likesCount={post.likes_count}
                dislikesCount={post.dislikes_count}
                userReaction={post.user_reaction}
                size="md"
              />

              <button
                type="button"
                onClick={() => toggleSave(post.id)}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg border cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 ${
                  bookmarked
                    ? 'border-neutral-300 dark:border-slate-600 bg-neutral-100 dark:bg-slate-700 text-neutral-950 dark:text-slate-100 font-semibold'
                    : 'border-neutral-200 dark:border-slate-700 bg-white dark:bg-[#1a1f27] hover:bg-neutral-50 dark:hover:bg-slate-800 text-neutral-700 dark:text-slate-200'
                }`}
              >
                {bookmarked ? (
                  <BookmarkSolidIcon className="w-3.5 h-3.5 text-neutral-950 dark:text-slate-100" />
                ) : (
                  <BookmarkIcon className="w-3.5 h-3.5 text-neutral-600 dark:text-slate-400" />
                )}
                <span>{bookmarked ? 'Saved to reading list' : 'Save Article'}</span>
              </button>
            </div>

            {/* Comments & Discussion Thread */}
            <div className="pt-4">
              <ThreadedComments postId={post.id} />
            </div>
          </article>

          {/* Desktop Right Context Sidebar (Sticky reading details) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-20 space-y-5">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1f242d] border border-neutral-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-slate-400">
                Article Information
              </h3>

              <div className="space-y-3.5 text-xs">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-400 dark:text-slate-400">Author</div>
                  <div className="font-semibold text-neutral-900 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
                    {post.is_anonymous ? (
                      <>
                        <IncognitoIcon className="w-3.5 h-3.5 text-neutral-500 dark:text-slate-400" />
                        <span>Anonymous</span>
                      </>
                    ) : (
                      <span>@{post.author_username || post.author_name || 'author'}</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-400 dark:text-slate-400">Published</div>
                  <div className="font-semibold text-neutral-800 dark:text-slate-200 mt-0.5">
                    {formattedFullDate || timeAgo}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-400 dark:text-slate-400">Word Count</div>
                    <div className="font-mono font-medium text-neutral-900 dark:text-slate-100">{wordCount} words</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-400 dark:text-slate-400">Reading Time</div>
                    <div className="font-mono font-medium text-neutral-900 dark:text-slate-100">{readTimeMin} min</div>
                  </div>
                </div>
              </div>

              {/* Author Actions */}
              {post.is_author && (
                <div className="pt-3 border-t border-neutral-100 dark:border-slate-800/80 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-[#1a1f27] hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-800 dark:text-slate-200 cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95"
                  >
                    <EditIcon className="w-3.5 h-3.5" />
                    <span>Edit Article</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 cursor-pointer transition-all active:scale-90"
                    title="Delete article"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="pt-1">
                <Link
                  to="/"
                  className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded-lg text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5" />
                  <span>Return to Articles</span>
                </Link>
              </div>
            </div>
          </aside>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        isPending={isDeleting}
        postTitle={post.title}
      />

      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        post={post}
      />
    </>
  );
}

// ─── Lightweight SVG Icons ────────────────────────────────────────────

function ArrowLeftIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function EditIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
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

function AlertCircleIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
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
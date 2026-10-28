import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { usePostReaction } from '../api/useReactions';

/**
 * ReactionButtons component for liking and disliking a post.
 * Features:
 * - Optimistic count updates and active state indication
 * - Toggle off if clicked again
 * - Switch reaction between like and dislike
 * - Non-authenticated prompt redirect
 * - Accessible labels & spring micro-interactions
 */
export default function ReactionButtons({
  postId,
  likesCount = 0,
  dislikesCount = 0,
  userReaction = null,
  size = 'md', // 'sm' | 'md'
}) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const { mutate: react, isPending } = usePostReaction(postId);

  const handleReact = (type) => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      setTimeout(() => setShowAuthPrompt(false), 3000);
      return;
    }
    react(type);
  };

  const isLiked = userReaction === 'like';
  const isDisliked = userReaction === 'dislike';

  const isSmall = size === 'sm';

  return (
    <div className="relative inline-flex items-center gap-1.5">
      {/* Like Button */}
      <button
        type="button"
        onClick={() => handleReact('like')}
        disabled={isPending}
        aria-label="Like post"
        aria-pressed={isLiked}
        title={isAuthenticated ? (isLiked ? 'Remove like' : 'Like post') : 'Sign in to like'}
        className={`inline-flex items-center gap-1.5 font-medium rounded-lg transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 cursor-pointer ${
          isSmall ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
        } ${
          isLiked
            ? 'bg-neutral-900 text-white dark:bg-slate-200 dark:text-slate-900 font-semibold shadow-2xs'
            : 'bg-white dark:bg-[#1a1f27] text-neutral-600 dark:text-slate-300 border border-neutral-200 dark:border-slate-700/80 hover:bg-neutral-50 dark:hover:bg-slate-800 hover:text-neutral-900 dark:hover:text-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
        }`}
      >
        <ThumbsUpIcon
          className={`${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${
            isLiked ? 'fill-current' : 'fill-none'
          }`}
        />
        <span>{likesCount}</span>
      </button>

      {/* Dislike Button */}
      <button
        type="button"
        onClick={() => handleReact('dislike')}
        disabled={isPending}
        aria-label="Dislike post"
        aria-pressed={isDisliked}
        title={isAuthenticated ? (isDisliked ? 'Remove dislike' : 'Dislike post') : 'Sign in to dislike'}
        className={`inline-flex items-center gap-1.5 font-medium rounded-lg transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 cursor-pointer ${
          isSmall ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
        } ${
          isDisliked
            ? 'bg-neutral-900 text-white dark:bg-slate-200 dark:text-slate-900 font-semibold shadow-2xs'
            : 'bg-white dark:bg-[#1a1f27] text-neutral-600 dark:text-slate-300 border border-neutral-200 dark:border-slate-700/80 hover:bg-neutral-50 dark:hover:bg-slate-800 hover:text-neutral-900 dark:hover:text-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
        }`}
      >
        <ThumbsDownIcon
          className={`${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${
            isDisliked ? 'fill-current' : 'fill-none'
          }`}
        />
        <span>{dislikesCount}</span>
      </button>

      {/* Auth Prompt Toast for Guests */}
      {showAuthPrompt && (
        <div className="absolute left-0 bottom-full mb-2 z-30 w-56 p-2.5 rounded-lg bg-neutral-900 dark:bg-slate-800 text-white dark:text-slate-100 text-xs shadow-lg animate-fadeIn border border-neutral-700 dark:border-slate-600">
          <p className="font-medium">Sign in required</p>
          <p className="text-[11px] text-neutral-300 dark:text-slate-300 mt-0.5">
            You must be logged in to react to posts.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-[11px] font-semibold text-white dark:text-slate-100 underline hover:no-underline cursor-pointer"
            >
              Sign In
            </button>
            <span className="text-neutral-500">•</span>
            <button
              type="button"
              onClick={() => setShowAuthPrompt(false)}
              className="text-[11px] text-neutral-400 hover:text-neutral-200 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ThumbsUpIcon(props) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.25A2.25 2.25 0 0 1 3 16.5v-4.5A2.25 2.25 0 0 1 5.25 9.75h1.383Z" />
    </svg>
  );
}

function ThumbsDownIcon(props) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016c.483 0 .964.078 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h2.27A2.25 2.25 0 0 1 21 7.75v4.5a2.25 2.25 0 0 1-2.25 2.25h-1.383c-.806 0-1.533.446-2.031 1.08a9.041 9.041 0 0 1-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 0 0-.322 1.672v.632a.75.75 0 0 1-.75.75 2.25 2.25 0 0 1-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H7.498Z" />
    </svg>
  );
}

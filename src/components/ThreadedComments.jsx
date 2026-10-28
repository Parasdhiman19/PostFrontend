import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from '../api/useComments';
import { formatTimeAgo } from '../utils/formatTime';
import ConfirmDialog from './ConfirmDialog';
import Pagination from './Pagination';

const COMMENTS_PAGE_SIZE = 5;

/**
 * ThreadedComments component for hierarchical discussions on posts.
 * Supports:
 * - Top-level comments and infinite nested replies
 * - Public vs. Anonymous commenting per comment
 * - Inline editing and deletion for comment authors
 * - Collapsible threads
 * - Responsive layout with slate styling
 */
export default function ThreadedComments({ postId }) {
  const { user, isAuthenticated } = useAuth();
  const [now] = useState(() => Date.now());
  const [currentPage, setCurrentPage] = useState(1);
  const { data: comments = [], isLoading, isError } = useComments(postId);

  const totalPages = Math.ceil(comments.length / COMMENTS_PAGE_SIZE) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedComments = comments.slice(
    (safeCurrentPage - 1) * COMMENTS_PAGE_SIZE,
    safeCurrentPage * COMMENTS_PAGE_SIZE
  );

  // Top-level comment form state
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [formError, setFormError] = useState('');

  // Active reply and edit tracking
  const [replyingToId, setReplyingToId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [collapsedIds, setCollapsedIds] = useState(new Set());

  // Mutations
  const createMutation = useCreateComment(postId, {
    onSuccess: (data, variables) => {
      if (!variables?.parent) {
        setContent('');
        setFormError('');
        setCurrentPage(1);
      }
      setReplyingToId(null);
    },
    onError: (err) => {
      setFormError(err?.response?.data?.detail || err?.response?.data?.content?.[0] || 'Failed to post comment.');
    },
  });

  const updateMutation = useUpdateComment(postId, {
    onSuccess: () => {
      setEditingId(null);
    },
  });

  const deleteMutation = useDeleteComment(postId);

  const handleTopLevelSubmit = (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      setFormError('Comment cannot be empty.');
      return;
    }
    setFormError('');
    createMutation.mutate({
      content: trimmed,
      parent: null,
      is_anonymous: isAnonymous,
    });
  };

  const toggleCollapse = (commentId) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  return (
    <section className="space-y-6 pt-6 border-t border-neutral-200/80 dark:border-slate-800" aria-label="Comments">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChatIcon className="w-4 h-4 text-neutral-500 dark:text-slate-400" />
          <h2 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white">
            Discussion ({comments.length})
          </h2>
        </div>
      </div>

      {/* Top-level Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleTopLevelSubmit} className="space-y-3 p-4 rounded-xl bg-white dark:bg-[#1a1f27] border border-neutral-200 dark:border-slate-700/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-slate-400">
              Leave a Comment
            </h3>

            {/* Public vs Anonymous Selector */}
            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-neutral-600 dark:text-slate-300">
                <input
                  type="radio"
                  name="top_comment_identity"
                  checked={!isAnonymous}
                  onChange={() => setIsAnonymous(false)}
                  className="accent-neutral-900 dark:accent-slate-200 cursor-pointer"
                />
                <span>@{user?.username}</span>
              </label>
              <span className="text-neutral-300 dark:text-slate-600">|</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-neutral-600 dark:text-slate-300">
                <input
                  type="radio"
                  name="top_comment_identity"
                  checked={isAnonymous}
                  onChange={() => setIsAnonymous(true)}
                  className="accent-neutral-900 dark:accent-slate-200 cursor-pointer"
                />
                <span>Anonymous</span>
              </label>
            </div>
          </div>

          <textarea
            rows={3}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (formError) setFormError('');
            }}
            placeholder="Share your perspective or ask a question..."
            disabled={createMutation.isPending}
            className="w-full px-3 py-2 text-sm rounded-lg bg-neutral-50 dark:bg-[#161b22] border border-neutral-200 dark:border-slate-700 text-neutral-900 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10 resize-y"
          />

          {formError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {formError}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createMutation.isPending || !content.trim()}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg bg-neutral-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-neutral-800 dark:hover:bg-white transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
            >
              {createMutation.isPending ? (
                <span>Posting...</span>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-3.5 h-3.5" />
                  <span>Post Comment</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-lg bg-neutral-50 dark:bg-[#1a1f27] border border-neutral-200 dark:border-slate-700/80 text-center space-y-2">
          <p className="text-xs text-neutral-600 dark:text-slate-300">
            Join the conversation. Sign in to post comments or replies.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/login"
              className="text-xs font-medium text-neutral-900 dark:text-slate-100 underline hover:no-underline"
            >
              Sign In
            </Link>
            <span className="text-neutral-400 dark:text-slate-500">•</span>
            <Link
              to="/register"
              className="text-xs font-medium text-neutral-600 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-slate-100"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-neutral-100 dark:bg-slate-800 rounded-lg" />
          <div className="h-20 bg-neutral-100 dark:bg-slate-800 rounded-lg ml-6" />
        </div>
      ) : isError ? (
        <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-xs text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
          Failed to load comments. Please refresh the page.
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-xs text-neutral-400 dark:text-slate-500 italic">
          No comments yet. Be the first to start the discussion!
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-4">
            {paginatedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={postId}
                currentUser={user}
                isAuthenticated={isAuthenticated}
                replyingToId={replyingToId}
                setReplyingToId={setReplyingToId}
                editingId={editingId}
                setEditingId={setEditingId}
                collapsedIds={collapsedIds}
                toggleCollapse={toggleCollapse}
                createMutation={createMutation}
                updateMutation={updateMutation}
                deleteMutation={deleteMutation}
                now={now}
                level={0}
              />
            ))}
          </div>

          {/* Comments Pagination */}
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(p)}
            totalItems={comments.length}
            pageSize={COMMENTS_PAGE_SIZE}
            itemName="discussion threads"
            className="pt-4"
          />
        </div>
      )}
    </section>
  );
}

/**
 * Recursive single comment component with threaded replies.
 */
function CommentItem({
  comment,
  postId,
  currentUser,
  isAuthenticated,
  replyingToId,
  setReplyingToId,
  editingId,
  setEditingId,
  collapsedIds,
  toggleCollapse,
  createMutation,
  updateMutation,
  deleteMutation,
  now,
  level = 0,
}) {

  const isReplying = replyingToId === comment.id;
  const isEditing = editingId === comment.id;
  const isCollapsed = collapsedIds.has(comment.id);
  const replies = comment.replies || [];
  const hasReplies = replies.length > 0;

  // Local state for replying
  const [replyContent, setReplyContent] = useState('');
  const [replyIsAnonymous, setReplyIsAnonymous] = useState(false);
  const [replyError, setReplyError] = useState('');

  // Local state for editing
  const [editContent, setEditContent] = useState(comment.content);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleReplySubmit = (e) => {
    e.preventDefault();
    const trimmed = replyContent.trim();
    if (!trimmed) {
      setReplyError('Reply cannot be empty.');
      return;
    }
    setReplyError('');
    createMutation.mutate(
      {
        content: trimmed,
        parent: comment.id,
        is_anonymous: replyIsAnonymous,
      },
      {
        onSuccess: () => {
          setReplyContent('');
          setReplyingToId(null);
          if (collapsedIds.has(comment.id)) {
            toggleCollapse(comment.id);
          }
        },
      }
    );
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const trimmed = editContent.trim();
    if (!trimmed) return;
    updateMutation.mutate({
      id: comment.id,
      content: trimmed,
    });
  };

  const handleDelete = () => {
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(comment.id, {
      onSuccess: () => {
        setIsDeleteOpen(false);
      },
    });
  };


  // Relative time helper
  const elapsed = comment.created_at
    ? Math.max(0, Math.floor((now - new Date(comment.created_at).getTime()) / 1000))
    : 0;
  const timeDisplay = formatTimeAgo(elapsed);


  const isAuthor = comment.is_author;
  const isAnon = comment.is_anonymous;
  const authorDisplay = isAnon ? 'Anonymous' : `@${comment.author_username}`;

  return (
    <div className={`group space-y-2 ${level > 0 ? (level <= 2 ? 'mt-3 pl-2.5 sm:pl-5 border-l border-neutral-200 dark:border-slate-800' : 'mt-2 pl-1.5 sm:pl-3 border-l-2 border-neutral-300 dark:border-slate-700') : ''}`}>
      <div className="p-3.5 rounded-lg bg-white dark:bg-[#1f242d] border border-neutral-200/80 dark:border-slate-800/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5 min-w-0">
        
        {/* Comment Header */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold border ${
              isAnon
                ? 'bg-neutral-100 dark:bg-slate-800 text-neutral-500 dark:text-slate-400 border-neutral-300 dark:border-slate-700'
                : 'bg-neutral-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent'
            }`}>
              {isAnon ? '?' : (comment.author_username || 'U').charAt(0).toUpperCase()}
            </div>

            <span className="font-semibold text-neutral-900 dark:text-slate-100">
              {authorDisplay}
            </span>

            {isAuthor && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-400 border border-neutral-200 dark:border-slate-700">
                You
              </span>
            )}

            <span className="text-neutral-400 dark:text-slate-500">•</span>
            <time className="text-neutral-400 dark:text-slate-400 text-[11px]" title={comment.created_at}>
              {timeDisplay}
            </time>
          </div>

          {/* Thread collapse toggle for comments with replies */}
          {hasReplies && (
            <button
              type="button"
              onClick={() => toggleCollapse(comment.id)}
              className="text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-slate-200 cursor-pointer"
            >
              {isCollapsed ? `+ ${replies.length} replies` : 'Collapse'}
            </button>
          )}
        </div>

        {/* Comment Content / Edit Mode */}
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="space-y-2 pt-1">
            <textarea
              rows={2}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-md bg-neutral-50 dark:bg-[#161b22] border border-neutral-300 dark:border-slate-700 text-neutral-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white resize-y"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-slate-200 px-2.5 py-1 rounded cursor-pointer"
              >
                <XMarkIcon className="w-3 h-3" />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending || !editContent.trim()}
                className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded bg-neutral-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-neutral-800 dark:hover:bg-white cursor-pointer"
              >
                <CheckIcon className="w-3 h-3" />
                <span>{updateMutation.isPending ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </form>
        ) : (
          <p className="text-xs sm:text-sm text-neutral-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        )}

        {/* Action Bar (Reply, Edit, Delete) */}
        {!isEditing && (
          <div className="flex items-center gap-3 pt-1 text-xs text-neutral-500 dark:text-slate-400 border-t border-neutral-100 dark:border-slate-800/60">
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  setReplyingToId(isReplying ? null : comment.id);
                  setReplyError('');
                }}
                className="inline-flex items-center gap-1 hover:text-neutral-900 dark:hover:text-slate-100 font-medium transition-colors cursor-pointer"
              >
                {isReplying ? (
                  <>
                    <XMarkIcon className="w-3 h-3" />
                    <span>Cancel</span>
                  </>
                ) : (
                  <>
                    <ReplyIcon className="w-3 h-3" />
                    <span>Reply</span>
                  </>
                )}
              </button>
            )}

            {isAuthor && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(comment.id);
                    setEditContent(comment.content);
                  }}
                  className="inline-flex items-center gap-1 hover:text-neutral-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                >
                  <PencilSquareIcon className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center gap-1 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <TrashIcon className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Inline Reply Form */}
      {isReplying && (
        <form onSubmit={handleReplySubmit} className="ml-3 sm:ml-5 p-3 rounded-lg bg-neutral-50 dark:bg-[#1a1f27] border border-neutral-200 dark:border-slate-700/80 space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-slate-400">
              Replying to {authorDisplay}
            </span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 cursor-pointer text-neutral-600 dark:text-slate-300">
                <input
                  type="radio"
                  name={`reply_identity_${comment.id}`}
                  checked={!replyIsAnonymous}
                  onChange={() => setReplyIsAnonymous(false)}
                  className="accent-neutral-900 dark:accent-slate-200 cursor-pointer"
                />
                <span>@{currentUser?.username}</span>
              </label>
              <span className="text-neutral-300 dark:text-slate-600">|</span>
              <label className="flex items-center gap-1 cursor-pointer text-neutral-600 dark:text-slate-300">
                <input
                  type="radio"
                  name={`reply_identity_${comment.id}`}
                  checked={replyIsAnonymous}
                  onChange={() => setReplyIsAnonymous(true)}
                  className="accent-neutral-900 dark:accent-slate-200 cursor-pointer"
                />
                <span>Anonymous</span>
              </label>
            </div>
          </div>

          <textarea
            rows={2}
            value={replyContent}
            onChange={(e) => {
              setReplyContent(e.target.value);
              if (replyError) setReplyError('');
            }}
            placeholder="Write your reply..."
            disabled={createMutation.isPending}
            className="w-full px-3 py-1.5 text-xs rounded-md bg-white dark:bg-[#161b22] border border-neutral-300 dark:border-slate-700 text-neutral-900 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white resize-y"
          />

          {replyError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {replyError}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setReplyingToId(null)}
              className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-slate-200 px-2.5 py-1 rounded cursor-pointer"
            >
              <XMarkIcon className="w-3 h-3" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !replyContent.trim()}
              className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded bg-neutral-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-neutral-800 dark:hover:bg-white transition-all cursor-pointer"
            >
              <PaperAirplaneIcon className="w-3 h-3" />
              <span>{createMutation.isPending ? 'Sending...' : 'Send Reply'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Recursive Nested Replies */}
      {hasReplies && !isCollapsed && (
        <div className="space-y-2">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUser={currentUser}
              isAuthenticated={isAuthenticated}
              replyingToId={replyingToId}
              setReplyingToId={setReplyingToId}
              editingId={editingId}
              setEditingId={setEditingId}
              collapsedIds={collapsedIds}
              toggleCollapse={toggleCollapse}
              createMutation={createMutation}
              updateMutation={updateMutation}
              deleteMutation={deleteMutation}
              now={now}
              level={level + 1}
            />
          ))}

        </div>
      )}

      {/* Designed Comment Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Comment"
        message="Are you sure you want to permanently remove this comment? This action cannot be reversed."
        confirmLabel="Delete"
        isDestructive={true}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}


function ChatIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.502 49.188 49.188 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
    </svg>
  );
}

function ReplyIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    </svg>
  );
}

function PencilSquareIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
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

function PaperAirplaneIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  );
}

function CheckIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function XMarkIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

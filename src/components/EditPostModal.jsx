import { useState, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useUpdatePost } from '../api/useUpdatePost';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { applyFormatting } from '../utils/editorUtils';

const RULES = {
  TITLE_MIN: 3,
  TITLE_MAX: 250,
  CONTENT_MIN: 5,
};

export default function EditPostModal({ isOpen, onClose, post }) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-post-title"
      data-lenis-prevent
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/50 dark:bg-black/70 animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        data-lenis-prevent
        className="w-full max-w-xl bg-white dark:bg-[#1f242d] rounded-2xl border border-neutral-200/90 dark:border-slate-700 shadow-2xl p-6 sm:p-7 space-y-5 my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <EditPostForm key={`${post.id}-${post.updated_at || ''}`} post={post} onClose={onClose} />
      </div>
    </div>,
    document.body
  );
}

function EditPostForm({ post, onClose }) {
  const { user } = useAuth();
  const toast = useToast();
  const contentInputId = useId();

  const [title, setTitle] = useState(post.title || '');
  const [content, setContent] = useState(post.content || '');
  const [isAnonymous, setIsAnonymous] = useState(Boolean(post.is_anonymous));
  const [touched, setTouched] = useState({ title: false, content: false });
  const [serverErrors, setServerErrors] = useState({});

  const { mutate: updatePostMutation, isPending } = useUpdatePost({
    onSuccess: () => {
      toast.success('Article updated successfully.');
      onClose();
    },
    onError: (err) => {
      if (err?.response?.data && typeof err.response.data === 'object') {
        setServerErrors(err.response.data);
      }
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to update article');
    },
  });

  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  const titleError =
    touched.title &&
    (trimmedTitle.length === 0
      ? 'A post title is required.'
      : trimmedTitle.length < RULES.TITLE_MIN
      ? `Title must be at least ${RULES.TITLE_MIN} characters.`
      : trimmedTitle.length > RULES.TITLE_MAX
      ? `Title cannot exceed ${RULES.TITLE_MAX} characters.`
      : null);

  const contentError =
    touched.content &&
    (trimmedContent.length === 0
      ? 'Post content is required.'
      : trimmedContent.length < RULES.CONTENT_MIN
      ? `Content must be at least ${RULES.CONTENT_MIN} characters.`
      : null);

  const isFormValid =
    trimmedTitle.length >= RULES.TITLE_MIN &&
    trimmedTitle.length <= RULES.TITLE_MAX &&
    trimmedContent.length >= RULES.CONTENT_MIN;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setTouched({ title: true, content: true });
    setServerErrors({});

    if (!isFormValid || isPending) return;

    updatePostMutation({
      id: post.id,
      title: trimmedTitle,
      content: trimmedContent,
      is_anonymous: isAnonymous,
      author_name: isAnonymous ? 'Anonymous' : (post.author_username || user?.username || ''),
    });
  };

  const handleKeyDown = (e) => {
    const isMeta = e.metaKey || e.ctrlKey;
    const textarea = document.getElementById(contentInputId);

    if (isMeta && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
      return;
    }

    if (document.activeElement === textarea) {
      if (isMeta && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        applyFormatting(textarea, content, setContent, 'bold');
      } else if (isMeta && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        applyFormatting(textarea, content, setContent, 'italic');
      } else if (isMeta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        applyFormatting(textarea, content, setContent, 'link');
      }
    }
  };

  const executeFormat = (type) => {
    const textarea = document.getElementById(contentInputId);
    if (!textarea) return;
    applyFormatting(textarea, content, setContent, type);
  };

  return (
    <div onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-slate-800 pb-3.5 mb-4">
        <div className="space-y-0.5">
          <h2 id="edit-post-title" className="text-lg font-bold tracking-tight text-neutral-950 dark:text-white">
            Edit Article
          </h2>
          <p className="text-xs text-neutral-500 dark:text-slate-400">
            Changes apply instantly across your feed and detail view.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="text-neutral-400 dark:text-slate-400 hover:text-neutral-700 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Field */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-600 dark:text-slate-400">
            <label htmlFor="edit-post-input-title">Title *</label>
            <span className="text-[11px] font-mono text-neutral-400 dark:text-slate-400">
              {trimmedTitle.length}/{RULES.TITLE_MAX}
            </span>
          </div>
          <input
            id="edit-post-input-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched((p) => ({ ...p, title: true }))}
            maxLength={RULES.TITLE_MAX}
            disabled={isPending}
            className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white dark:bg-[#1a1f27] text-neutral-900 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
              titleError || serverErrors.title
                ? 'border-rose-300 dark:border-rose-700 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-neutral-200 dark:border-slate-700 hover:border-neutral-300 dark:hover:border-slate-600 focus:border-neutral-900 dark:focus:border-slate-400 focus:ring-neutral-900/10 dark:focus:ring-white/10'
            }`}
          />
          {titleError && <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{titleError}</p>}
          {serverErrors.title && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
              {Array.isArray(serverErrors.title) ? serverErrors.title.join(' ') : serverErrors.title}
            </p>
          )}
        </div>

        {/* Author Visibility Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-600 dark:text-slate-400 block">
            Author Visibility
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <label
              className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all select-none text-xs ${
                !isAnonymous
                  ? 'bg-neutral-50 dark:bg-slate-800 border-neutral-900 dark:border-slate-400 font-medium text-neutral-900 dark:text-slate-100'
                  : 'bg-white dark:bg-[#1a1f27] border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-400 hover:border-neutral-300'
              }`}
            >
              <input
                type="radio"
                name="edit_author_visibility"
                checked={!isAnonymous}
                onChange={() => setIsAnonymous(false)}
                className="accent-neutral-900 dark:accent-slate-200 cursor-pointer"
              />
              <span>Show my name (@{post.author_username || user?.username || 'user'})</span>
            </label>

            <label
              className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all select-none text-xs ${
                isAnonymous
                  ? 'bg-neutral-50 dark:bg-slate-800 border-neutral-900 dark:border-slate-400 font-medium text-neutral-900 dark:text-slate-100'
                  : 'bg-white dark:bg-[#1a1f27] border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-400 hover:border-neutral-300'
              }`}
            >
              <input
                type="radio"
                name="edit_author_visibility"
                checked={isAnonymous}
                onChange={() => setIsAnonymous(true)}
                className="accent-neutral-900 dark:accent-slate-200 cursor-pointer"
              />
              <span>Post anonymously</span>
            </label>
          </div>
        </div>

        {/* Content Field with Formatting Toolbar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-600 dark:text-slate-400">
            <label htmlFor={contentInputId}>Content *</label>
            <span className="text-[11px] font-mono text-neutral-400 dark:text-slate-400">
              min {RULES.CONTENT_MIN} chars
            </span>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-1 py-1 px-1.5 bg-neutral-50 dark:bg-[#1a1f27] border border-neutral-200 dark:border-slate-700 rounded-lg text-xs text-neutral-700 dark:text-slate-300">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeFormat('bold')}
              className="px-2 py-0.5 font-bold hover:bg-neutral-200/70 dark:hover:bg-slate-700 rounded transition-all cursor-pointer"
              title="Bold"
            >
              B
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeFormat('italic')}
              className="px-2 py-0.5 italic font-serif hover:bg-neutral-200/70 dark:hover:bg-slate-700 rounded transition-all cursor-pointer"
              title="Italic"
            >
              I
            </button>
            <span className="w-px h-3 bg-neutral-300 dark:bg-slate-700 mx-0.5" />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeFormat('h2')}
              className="px-1.5 py-0.5 font-mono text-[11px] font-semibold hover:bg-neutral-200/70 dark:hover:bg-slate-700 rounded transition-all cursor-pointer"
              title="Heading 2"
            >
              H2
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeFormat('quote')}
              className="px-2 py-0.5 hover:bg-neutral-200/70 dark:hover:bg-slate-700 rounded transition-all font-serif cursor-pointer"
              title="Quote"
            >
              &ldquo;
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeFormat('code')}
              className="px-1.5 py-0.5 font-mono text-[11px] hover:bg-neutral-200/70 dark:hover:bg-slate-700 rounded transition-all cursor-pointer"
              title="Code"
            >
              &lt;/&gt;
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeFormat('link')}
              className="px-2 py-0.5 hover:bg-neutral-200/70 dark:hover:bg-slate-700 rounded transition-all text-[11px] cursor-pointer"
              title="Link"
            >
              🔗
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeFormat('bulletList')}
              className="px-2 py-0.5 hover:bg-neutral-200/70 dark:hover:bg-slate-700 rounded transition-all text-[11px] cursor-pointer"
              title="List"
            >
              • List
            </button>
          </div>

          <textarea
            id={contentInputId}
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={() => setTouched((p) => ({ ...p, content: true }))}
            disabled={isPending}
            className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white dark:bg-[#1a1f27] text-neutral-900 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all leading-relaxed ${
              contentError || serverErrors.content
                ? 'border-rose-300 dark:border-rose-700 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-neutral-200 dark:border-slate-700 hover:border-neutral-300 dark:hover:border-slate-600 focus:border-neutral-900 dark:focus:border-slate-400 focus:ring-neutral-900/10 dark:focus:ring-white/10'
            }`}
          />
          {contentError && <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{contentError}</p>}
          {serverErrors.content && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
              {Array.isArray(serverErrors.content) ? serverErrors.content.join(' ') : serverErrors.content}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            disabled={!isFormValid || isPending}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white dark:text-slate-900 bg-neutral-900 dark:bg-slate-100 hover:bg-neutral-800 dark:hover:bg-white rounded-lg transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 disabled:opacity-40 shadow-2xs cursor-pointer"
          >
            {isPending ? (
              <>
                <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}


function CloseIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SpinnerIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

import { useState, useEffect, useId } from 'react';
import { useNavigate, Link } from 'react-router';
import { useCreatePost } from '../api/useCreatePost';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { applyFormatting } from '../utils/editorUtils';
import MarkdownRenderer from '../components/MarkdownRenderer';
import ConfirmDialog from '../components/ConfirmDialog';

// Validation constraints matching Backend DRF PostSerializer & Post model
const RULES = {
  TITLE_MIN: 3,
  TITLE_MAX: 250,
  CONTENT_MIN: 5,
};

const DRAFT_STORAGE_KEY = 'blogspace_draft_post';

function getInitialDraft() {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(DRAFT_STORAGE_KEY) : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        title: parsed.title || '',
        content: parsed.content || '',
        isAnonymous: Boolean(parsed.isAnonymous),
        hasRestored: Boolean(parsed.title || parsed.content),
      };
    }
  } catch {
    // Ignore storage read errors
  }
  return { title: '', content: '', isAnonymous: false, hasRestored: false };
}

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const titleId = useId();
  const contentId = useId();

  // Lazy draft state initialization
  const [initialDraft] = useState(getInitialDraft);
  const [title, setTitle] = useState(initialDraft.title);
  const [content, setContent] = useState(initialDraft.content);
  const [isAnonymous, setIsAnonymous] = useState(initialDraft.isAnonymous);
  const [hasDraftRestored, setHasDraftRestored] = useState(initialDraft.hasRestored);

  // UI state for mobile/tablet tab switching
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview'
  const [touched, setTouched] = useState({ title: false, content: false });
  const [serverErrors, setServerErrors] = useState({});
  const [isClearDraftDialogOpen, setIsClearDraftDialogOpen] = useState(false);

  // TanStack Query Mutation
  const { mutate: createPostMutation, isPending, isError, error } = useCreatePost({
    onSuccess: (data) => {
      // Clear draft on successful creation
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // Safe fallback
      }

      toast.success('Post published successfully!');

      setTimeout(() => {
        if (data?.id) {
          navigate(`/details/${data.id}`);
        } else {
          navigate('/');
        }
      }, 500);
    },
    onError: (err) => {
      if (err?.response?.data && typeof err.response.data === 'object') {
        setServerErrors(err.response.data);
      }
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to publish post');
    },
  });

  // Auto-save draft on form changes
  useEffect(() => {
    if (title || content) {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({ title, content, isAnonymous, updatedAt: Date.now() })
        );
      } catch {
        // Ignore storage write errors
      }
    }
  }, [title, content, isAnonymous]);

  // Client-side validation logic
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  const titleError =
    touched.title &&
    (trimmedTitle.length === 0
      ? 'A post title is required.'
      : trimmedTitle.length < RULES.TITLE_MIN
      ? `Title must be at least ${RULES.TITLE_MIN} characters (currently ${trimmedTitle.length}).`
      : trimmedTitle.length > RULES.TITLE_MAX
      ? `Title cannot exceed ${RULES.TITLE_MAX} characters.`
      : null);

  const contentError =
    touched.content &&
    (trimmedContent.length === 0
      ? 'Post content is required.'
      : trimmedContent.length < RULES.CONTENT_MIN
      ? `Content must be at least ${RULES.CONTENT_MIN} characters (currently ${trimmedContent.length}).`
      : null);

  const isFormValid =
    trimmedTitle.length >= RULES.TITLE_MIN &&
    trimmedTitle.length <= RULES.TITLE_MAX &&
    trimmedContent.length >= RULES.CONTENT_MIN;

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleClearDraft = () => {
    if (title || content) {
      setIsClearDraftDialogOpen(true);
      return;
    }
    performReset();
  };

  const performReset = () => {
    setTitle('');
    setContent('');
    setIsAnonymous(false);
    setTouched({ title: false, content: false });
    setServerErrors({});
    setHasDraftRestored(false);
    setIsClearDraftDialogOpen(false);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Safe fallback
    }
    toast.info('Draft discarded and form reset.');
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    setTouched({ title: true, content: true });
    setServerErrors({});

    if (!isFormValid || isPending) return;

    createPostMutation({
      title: trimmedTitle,
      content: trimmedContent,
      is_anonymous: isAnonymous,
      author_name: isAnonymous ? 'Anonymous' : (user?.username || ''),
    });
  };

  // Keyboard shortcut: Cmd+Enter to submit, Cmd+B, Cmd+I, Cmd+K in editor
  const handleKeyDown = (e) => {
    const isMeta = e.metaKey || e.ctrlKey;
    const textarea = document.getElementById(contentId);

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
    const textarea = document.getElementById(contentId);
    if (!textarea) return;
    applyFormatting(textarea, content, setContent, type);
  };

  // Word and character count helpers
  const wordCount = trimmedContent ? trimmedContent.split(/\s+/).filter(Boolean).length : 0;
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn" onKeyDown={handleKeyDown}>
      {/* ─── Header Context & Draft Actions ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-400 dark:text-slate-400 mb-1">
            <Link to="/" className="hover:text-neutral-700 dark:hover:text-slate-200 transition-colors cursor-pointer">
              Feed
            </Link>
            <span>/</span>
            <span className="text-neutral-700 dark:text-slate-200">New Article</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
            Create Post
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Draft indicator */}
          {(title || content) && (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 dark:text-slate-400 bg-white dark:bg-[#1f242d] px-2.5 py-1 rounded-md border border-neutral-200 dark:border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Draft saved</span>
            </div>
          )}

          {/* Clear Draft Action */}
          {(title || content) && (
            <button
              type="button"
              onClick={handleClearDraft}
              className="inline-flex items-center gap-1 text-xs text-neutral-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 py-1 px-2.5 rounded hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Discard draft"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Draft Restored Banner ──────────────────────────────────── */}
      {hasDraftRestored && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-[#1f242d] border border-neutral-200/90 dark:border-slate-700 text-xs text-neutral-600 dark:text-slate-300 shadow-2xs">
          <div className="flex items-center gap-2">
            <InfoIcon className="w-4 h-4 text-neutral-600 dark:text-slate-300 shrink-0" />
            <span>Restored your unfinished draft from local storage.</span>
          </div>
          <button
            type="button"
            onClick={() => setHasDraftRestored(false)}
            className="text-neutral-400 hover:text-neutral-800 dark:hover:text-slate-100 ml-2 font-medium cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Server General Error Banner ────────────────────────────── */}
      {isError && !serverErrors.title && !serverErrors.content && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 text-xs leading-relaxed shadow-2xs">
          <AlertCircleIcon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-rose-900 dark:text-rose-200">Unable to publish post: </span>
            <span>
              {error?.response?.data?.detail ||
                error?.message ||
                'Network connection failed. Ensure backend server is running.'}
            </span>
          </div>
        </div>
      )}

      {/* ─── Desktop 2-Column Split: Editor + Live Preview ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form Column (Full width on mobile/tablet, 7 cols on desktop) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            
            {/* Title Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={titleId}
                  className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-slate-400"
                >
                  Title <span className="text-rose-500">*</span>
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    trimmedTitle.length > RULES.TITLE_MAX
                      ? 'text-rose-600 font-semibold'
                      : 'text-neutral-400 dark:text-slate-400'
                  }`}
                >
                  {trimmedTitle.length}/{RULES.TITLE_MAX}
                </span>
              </div>

              <input
                id={titleId}
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (serverErrors.title) {
                    setServerErrors((prev) => ({ ...prev, title: null }));
                  }
                }}
                onBlur={() => handleBlur('title')}
                placeholder="e.g. Architectural Patterns in Modern Web Development"
                maxLength={RULES.TITLE_MAX}
                disabled={isPending}
                autoFocus
                className={`w-full px-4 py-3 rounded-xl text-base sm:text-lg font-medium bg-white dark:bg-[#1a1f27] border transition-all duration-200 placeholder:text-neutral-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 disabled:bg-neutral-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed ${
                  titleError || serverErrors.title
                    ? 'border-rose-300 dark:border-rose-700 focus:border-rose-500 focus:ring-rose-500/20 text-rose-950 dark:text-rose-200'
                    : 'border-neutral-200/90 dark:border-slate-700 hover:border-neutral-300 dark:hover:border-slate-600 focus:border-neutral-900 dark:focus:border-slate-400 focus:ring-neutral-900/10 dark:focus:ring-white/10 text-neutral-950 dark:text-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                }`}
              />

              {titleError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 mt-1">
                  <span>{titleError}</span>
                </p>
              )}
              {serverErrors.title && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 mt-1">
                  <span>{Array.isArray(serverErrors.title) ? serverErrors.title.join(' ') : serverErrors.title}</span>
                </p>
              )}
            </div>

            {/* ─── Author Visibility Option (Show My Name vs Post Anonymously) ── */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-slate-400">
                Author Visibility <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Show my name */}
                <label
                  className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
                    !isAnonymous
                      ? 'bg-neutral-50 dark:bg-slate-800/80 border-neutral-900 dark:border-slate-400 ring-1 ring-neutral-900/10 dark:ring-white/10'
                      : 'bg-white dark:bg-[#1a1f27] border-neutral-200 dark:border-slate-700/80 hover:border-neutral-300 dark:hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="author_visibility"
                    checked={!isAnonymous}
                    onChange={() => setIsAnonymous(false)}
                    className="mt-0.5 accent-neutral-900 dark:accent-slate-200 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-neutral-700 dark:text-slate-300" />
                      <span className="text-xs font-semibold text-neutral-900 dark:text-slate-100">
                        Show my name
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-slate-400 leading-snug">
                      Display @{user?.username || 'user'} publicly on this post.
                    </p>
                  </div>
                </label>

                {/* Post anonymously */}
                <label
                  className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
                    isAnonymous
                      ? 'bg-neutral-50 dark:bg-slate-800/80 border-neutral-900 dark:border-slate-400 ring-1 ring-neutral-900/10 dark:ring-white/10'
                      : 'bg-white dark:bg-[#1a1f27] border-neutral-200 dark:border-slate-700/80 hover:border-neutral-300 dark:hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="author_visibility"
                    checked={isAnonymous}
                    onChange={() => setIsAnonymous(true)}
                    className="mt-0.5 accent-neutral-900 dark:accent-slate-200 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <IncognitoIcon className="w-3.5 h-3.5 text-neutral-700 dark:text-slate-300" />
                      <span className="text-xs font-semibold text-neutral-900 dark:text-slate-100">
                        Post anonymously
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-slate-400 leading-snug">
                      Display &ldquo;Anonymous&rdquo; instead of your username.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Content Field & Editor Toolbar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-slate-800 pb-2">
                {/* Mobile / Tablet Tab Switcher (Hidden on desktop live split) */}
                <div className="flex lg:hidden items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('write')}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'write'
                        ? 'bg-neutral-200/70 dark:bg-slate-700 text-neutral-950 dark:text-slate-100 font-semibold shadow-2xs'
                        : 'text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <EditIcon className="w-3.5 h-3.5" />
                    <span>Write</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'preview'
                        ? 'bg-neutral-200/70 dark:bg-slate-700 text-neutral-950 dark:text-slate-100 font-semibold shadow-2xs'
                        : 'text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <EyeIcon className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                </div>

                {/* Desktop label */}
                <span className="hidden lg:inline text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-slate-400">
                  Article Content <span className="text-rose-500">*</span>
                </span>

                <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400 dark:text-slate-400">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{readingTimeMin} min read</span>
                </div>
              </div>

              {/* Mobile Preview Mode (Only visible when activeTab === 'preview' on screens < lg) */}
              <div className={activeTab === 'preview' ? 'block lg:hidden' : 'hidden'}>
                <div className="w-full min-h-64 p-5 sm:p-6 rounded-xl bg-white dark:bg-[#1f242d] border border-neutral-200/90 dark:border-slate-700/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-4">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-slate-400">
                      {isAnonymous ? 'Anonymous Post' : `@${user?.username || 'user'}`}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-950 dark:text-white mt-1">
                      {title.trim() || 'Untitled Post'}
                    </h2>
                  </div>
                  <div className="h-px bg-neutral-100 dark:bg-slate-800" />
                  {trimmedContent ? (
                    <MarkdownRenderer content={trimmedContent} />
                  ) : (
                    <div className="text-center py-10 text-xs text-neutral-400 dark:text-slate-400 italic">
                      No content written yet. Switch to the Write tab to draft.
                    </div>
                  )}
                </div>
              </div>

              {/* Editor Workspace (Always visible on desktop, or when activeTab === 'write' on mobile) */}
              <div className={activeTab === 'write' ? 'block' : 'hidden lg:block'}>
                <div className="space-y-2">
                  {/* Rich Text Toolbar with Fluid Horizontal Scroll on Small Mobile */}
                  <div className="flex items-center gap-1 py-1.5 px-2 bg-neutral-50 dark:bg-[#1f242d] border border-neutral-200/80 dark:border-slate-700 rounded-xl text-xs text-neutral-700 dark:text-slate-300 overflow-x-auto no-scrollbar">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormat('bold')}
                      className="px-2.5 py-1 font-bold hover:bg-neutral-200/70 dark:hover:bg-slate-700 dark:hover:text-slate-100 rounded-lg transition-all active:scale-90 cursor-pointer shrink-0"
                      title="Bold (Cmd+B)"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormat('italic')}
                      className="px-2.5 py-1 italic font-serif hover:bg-neutral-200/70 dark:hover:bg-slate-700 dark:hover:text-slate-100 rounded-lg transition-all active:scale-90 cursor-pointer shrink-0"
                      title="Italic (Cmd+I)"
                    >
                      I
                    </button>
                    <span className="w-px h-3.5 bg-neutral-300 dark:bg-slate-700 mx-0.5 shrink-0" />

                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormat('h2')}
                      className="px-2 py-1 font-mono text-[11px] font-semibold hover:bg-neutral-200/70 dark:hover:bg-slate-700 dark:hover:text-slate-100 rounded-lg transition-all active:scale-90 cursor-pointer shrink-0"
                      title="Heading 2"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormat('h3')}
                      className="px-2 py-1 font-mono text-[11px] font-semibold hover:bg-neutral-200/70 dark:hover:bg-slate-700 dark:hover:text-slate-100 rounded-lg transition-all active:scale-90 cursor-pointer shrink-0"
                      title="Heading 3"
                    >
                      H3
                    </button>
                    <span className="w-px h-3.5 bg-neutral-300 dark:bg-slate-700 mx-0.5 shrink-0" />

                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormat('quote')}
                      className="px-2 py-1 hover:bg-neutral-200/70 dark:hover:bg-slate-700 dark:hover:text-slate-100 rounded-lg transition-all active:scale-90 font-serif cursor-pointer shrink-0"
                      title="Blockquote"
                    >
                      &ldquo; &rdquo;
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormat('code')}
                      className="px-2 py-1 font-mono text-[11px] hover:bg-neutral-200/70 dark:hover:bg-slate-700 dark:hover:text-slate-100 rounded-lg transition-all active:scale-90 cursor-pointer shrink-0"
                      title="Code Block"
                    >
                      &lt;/&gt;
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormat('link')}
                      className="px-2.5 py-1 hover:bg-neutral-200/70 dark:hover:bg-slate-700 dark:hover:text-slate-100 rounded-lg transition-all active:scale-90 text-[11px] cursor-pointer shrink-0"
                      title="Insert Link (Cmd+K)"
                    >
                      🔗 Link
                    </button>
                    <span className="w-px h-3.5 bg-neutral-300 dark:bg-slate-700 mx-0.5 shrink-0" />

                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormat('bulletList')}
                      className="px-2 py-1 hover:bg-neutral-200/70 dark:hover:bg-slate-700 dark:hover:text-slate-100 rounded-lg transition-all active:scale-90 text-[11px] cursor-pointer shrink-0"
                      title="Bullet List"
                    >
                      • List
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormat('numberedList')}
                      className="px-2 py-1 hover:bg-neutral-200/70 dark:hover:bg-slate-700 dark:hover:text-slate-100 rounded-lg transition-all active:scale-90 text-[11px] cursor-pointer shrink-0"
                      title="Numbered List"
                    >
                      1. List
                    </button>
                  </div>

                  <textarea
                    id={contentId}
                    rows={14}
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      if (serverErrors.content) {
                        setServerErrors((prev) => ({ ...prev, content: null }));
                      }
                    }}
                    onBlur={() => handleBlur('content')}
                    placeholder="Write article in Markdown... Use **bold**, *italic*, headings, code blocks, lists, and links."
                    disabled={isPending}
                    className={`w-full px-4 py-3.5 rounded-xl text-sm leading-relaxed bg-white dark:bg-[#1a1f27] border transition-all duration-200 placeholder:text-neutral-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 font-normal resize-y min-h-72 disabled:bg-neutral-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed ${
                      contentError || serverErrors.content
                        ? 'border-rose-300 dark:border-rose-700 focus:border-rose-500 focus:ring-rose-500/20 text-rose-950 dark:text-rose-200'
                        : 'border-neutral-200/90 dark:border-slate-700 hover:border-neutral-300 dark:hover:border-slate-600 focus:border-neutral-900 dark:focus:border-slate-400 focus:ring-neutral-900/10 dark:focus:ring-white/10 text-neutral-950 dark:text-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                    }`}
                  />

                  {contentError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1">
                      {contentError}
                    </p>
                  )}
                  {serverErrors.content && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1">
                      {Array.isArray(serverErrors.content)
                        ? serverErrors.content.join(' ')
                        : serverErrors.content}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Action Footer ──────────────────────────────────── */}
            <div className="pt-4 border-t border-neutral-200/80 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-100 px-3.5 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </Link>
                <span className="hidden sm:inline text-xs text-neutral-400 dark:text-slate-400">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 rounded text-neutral-600 dark:text-slate-400">⌘</kbd> + <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 rounded text-neutral-600 dark:text-slate-400">Enter</kbd> to publish
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!isFormValid || isPending}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-xl select-none transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 shadow-2xs ${
                    !isFormValid || isPending
                      ? 'bg-neutral-100 dark:bg-slate-800/80 text-neutral-400 dark:text-slate-500 cursor-not-allowed border border-neutral-200 dark:border-slate-700'
                      : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 cursor-pointer'
                  }`}
                >
                  {isPending ? (
                    <>
                      <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <PublishIcon className="w-3.5 h-3.5" />
                      <span>Publish Article</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        </div>

        {/* Right Desktop Real-Time Live Preview Pane (Hidden on Mobile/Tablet) */}
        <aside className="hidden lg:block lg:col-span-5 sticky top-20 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-slate-400 font-medium px-1">
            <span className="flex items-center gap-1.5">
              <EyeIcon className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </span>
            <span className="text-[11px] font-mono text-neutral-400">Real-time Markdown</span>
          </div>

          <div
            data-lenis-prevent
            className="p-6 rounded-2xl bg-white dark:bg-[#1f242d] border border-neutral-200/90 dark:border-slate-800 shadow-2xs space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto"
          >
            <div>
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-slate-400">
                {isAnonymous ? (
                  <>
                    <IncognitoIcon className="w-3.5 h-3.5" />
                    <span>Anonymous Post</span>
                  </>
                ) : (
                  <>
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>@{user?.username || 'user'}</span>
                  </>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-950 dark:text-white mt-1 leading-snug">
                {title.trim() || 'Untitled Article'}
              </h2>
            </div>

            <div className="h-px bg-neutral-100 dark:bg-slate-800" />

            {trimmedContent ? (
              <MarkdownRenderer content={trimmedContent} />
            ) : (
              <div className="text-center py-12 text-xs text-neutral-400 dark:text-slate-400 italic">
                Start writing in the left pane to see your formatted article here in real-time.
              </div>
            )}
          </div>
        </aside>

      </div>

      {/* Discard Draft Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isClearDraftDialogOpen}
        onClose={() => setIsClearDraftDialogOpen(false)}
        onConfirm={performReset}
        title="Discard Draft?"
        message="Are you sure you want to discard your current article draft? All unsaved title and content changes will be permanently removed from this browser."
        confirmText="Discard Draft"
        confirmVariant="danger"
      />
    </div>
  );
}

// ─── Inline Lightweight Icons ─────────────────────────────────────────

function EditIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
    </svg>
  );
}

function EyeIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function PublishIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
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

function InfoIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
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

function UserIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
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

function XMarkIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
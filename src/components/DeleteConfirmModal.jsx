import { useEffect } from 'react';

/**
 * Accessible confirmation modal for permanently deleting a post.
 */
export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, isPending, postTitle }) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isPending) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 dark:bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#1f242d] rounded-xl border border-neutral-200/90 dark:border-slate-700 shadow-xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-slate-300 border border-neutral-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <TrashIcon className="w-4 h-4" />
          </div>

          <div className="space-y-1">
            <h2 id="delete-dialog-title" className="text-base font-semibold text-neutral-950 dark:text-slate-100">
              Delete article?
            </h2>
            <p className="text-xs text-neutral-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-neutral-800 dark:text-slate-200">“{postTitle || 'this post'}”</span>? This action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 dark:bg-rose-600 hover:bg-rose-700 dark:hover:bg-rose-500 rounded-lg transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 disabled:opacity-50 shadow-2xs cursor-pointer"
          >
            {isPending ? (
              <>
                <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <TrashIcon className="w-3.5 h-3.5" />
                <span>Delete permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
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

function SpinnerIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

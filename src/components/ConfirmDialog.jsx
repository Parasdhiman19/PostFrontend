import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Reusable, application-styled Confirmation Dialog component.
 * Replaces native browser window.confirm().
 * Supports keyboard accessibility (Escape), backdrop click dismissal,
 * loading state with spinner, and destructive action styling.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel,
  confirmText,
  cancelLabel = 'Cancel',
  cancelText,
  isDestructive = false,
  confirmVariant = 'default',
  isPending = false,
}) {
  const effectiveConfirmLabel = confirmText || confirmLabel || 'Confirm';
  const effectiveCancelLabel = cancelText || cancelLabel || 'Cancel';
  const effectiveIsDestructive = isDestructive || confirmVariant === 'danger';

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

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      data-lenis-prevent
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/50 dark:bg-black/70 animate-fadeIn"
      onClick={() => {
        if (!isPending) onClose();
      }}
    >
      <div
        data-lenis-prevent
        className="w-full max-w-md bg-white dark:bg-[#1f242d] rounded-2xl border border-neutral-200/90 dark:border-slate-700 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center ${
              effectiveIsDestructive
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
            }`}
          >
            {effectiveIsDestructive ? (
              <TrashIcon className="w-5 h-5" />
            ) : (
              <AlertTriangleIcon className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-1">
            <h2
              id="confirm-dialog-title"
              className="text-base font-bold tracking-tight text-neutral-950 dark:text-white"
            >
              {title}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-slate-400 leading-relaxed font-normal">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="inline-flex items-center justify-center text-xs font-medium px-4 py-2 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-[#1a1f27] text-neutral-700 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{effectiveCancelLabel}</span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg text-white transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              effectiveIsDestructive
                ? 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500'
                : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900'
            }`}
          >
            {isPending ? (
              <>
                <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{effectiveConfirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function TrashIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

function AlertTriangleIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
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

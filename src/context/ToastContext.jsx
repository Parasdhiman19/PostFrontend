import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = 'info', duration = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <aside
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-lg text-xs font-medium animate-fadeIn transition-all duration-200 ${
              toast.type === 'success'
                ? 'bg-white dark:bg-[#1f242d] border-emerald-300 dark:border-emerald-800 text-neutral-900 dark:text-slate-100'
                : toast.type === 'error'
                ? 'bg-white dark:bg-[#1f242d] border-rose-300 dark:border-rose-800 text-neutral-900 dark:text-slate-100'
                : 'bg-white dark:bg-[#1f242d] border-neutral-300 dark:border-slate-700 text-neutral-900 dark:text-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' && (
                <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckIcon className="w-3.5 h-3.5" />
                </div>
              )}
              {toast.type === 'error' && (
                <div className="w-5 h-5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <AlertCircleIcon className="w-3.5 h-3.5" />
                </div>
              )}
              {toast.type === 'info' && (
                <div className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <InfoIcon className="w-3.5 h-3.5" />
                </div>
              )}
              <span className="leading-snug">{toast.message}</span>
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-slate-200 p-1 rounded transition-colors cursor-pointer"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </aside>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return {
    addToast: context.addToast,
    success: (msg, dur) => context.addToast(msg, 'success', dur),
    error: (msg, dur) => context.addToast(msg, 'error', dur),
    info: (msg, dur) => context.addToast(msg, 'info', dur),
  };
}

function CheckIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function AlertCircleIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
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

function CloseIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

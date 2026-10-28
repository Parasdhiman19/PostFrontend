/**
 * Reusable Minimalist Pagination Component
 * 
 * Features:
 * - Smart page numbers with ellipsis (e.g., 1 ... 4 5 6 ... 12)
 * - Accessible Next/Previous controls with keyboard support
 * - Items range counter ("Showing 1–6 of 14 articles")
 * - Slate/dark mode styling matching the application design system
 * - Responsive layout: stacked/compact on mobile, expanded on desktop
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems,
  pageSize,
  itemName = 'items',
  className = '',
}) {
  // If there's 1 or fewer pages, no pagination controls are needed
  if (totalPages <= 1) return null;

  const handlePageClick = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const pages = getPageNumbers();

  // Calculate items range if totalItems and pageSize are provided
  let rangeSummary = null;
  if (typeof totalItems === 'number' && typeof pageSize === 'number' && totalItems > 0) {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    rangeSummary = (
      <span>
        Showing <span className="font-semibold text-neutral-900 dark:text-slate-100">{start}</span>–
        <span className="font-semibold text-neutral-900 dark:text-slate-100">{end}</span> of{' '}
        <span className="font-semibold text-neutral-900 dark:text-slate-100">{totalItems}</span> {itemName}
      </span>
    );
  }

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`pt-6 border-t border-neutral-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}
    >
      {/* Range Summary / Page indicator */}
      <div className="text-xs text-neutral-500 dark:text-slate-400">
        {rangeSummary || (
          <span>
            Page <span className="font-semibold text-neutral-900 dark:text-slate-100">{currentPage}</span> of{' '}
            <span className="font-semibold text-neutral-900 dark:text-slate-100">{totalPages}</span>
          </span>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1 self-center sm:self-auto">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Go to previous page"
          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-[#1f242d] hover:bg-neutral-50 dark:hover:bg-[#272e39] text-xs font-medium text-neutral-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 shadow-2xs"
        >
          <ChevronLeftIcon className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Prev</span>
        </button>

        {/* Numeric Page Buttons */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-xs font-mono text-neutral-400 dark:text-slate-500 select-none"
                >
                  …
                </span>
              );
            }

            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePageClick(p)}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`Go to page ${p}`}
                className={`min-w-8 h-8 px-2 flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 cursor-pointer ${
                  isCurrent
                    ? 'bg-neutral-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-2xs'
                    : 'text-neutral-600 dark:text-slate-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Go to next page"
          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-[#1f242d] hover:bg-neutral-50 dark:hover:bg-[#272e39] text-xs font-medium text-neutral-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 shadow-2xs"
        >
          <span className="hidden xs:inline">Next</span>
          <ChevronRightIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </nav>
  );
}

function ChevronLeftIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRightIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

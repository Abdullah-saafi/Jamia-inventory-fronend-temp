/**
 * Reusable Pagination component
 *
 * Props:
 *   currentPage  {number}   – 1-based current page index
 *   totalItems   {number}   – total number of items across all pages
 *   pageSize     {number}   – items per page (default: 10)
 *   onPageChange {function} – called with the new page number
 *   pageSizeOptions {number[]} – optional array of page-size choices
 *   onPageSizeChange {function} – called with the new page size (optional)
 *
 * Usage:
 *   <Pagination
 *     currentPage={page}
 *     totalItems={requests.length}
 *     pageSize={pageSize}
 *     onPageChange={setPage}
 *     pageSizeOptions={[10, 25, 50]}
 *     onPageSizeChange={setPageSize}
 *   />
 */

export default function Pagination({
  currentPage,
  totalItems,
  pageSize = 10,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (currentPage >= totalPages - 3)
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const go = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage)
      onPageChange(page);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg text-sm text-gray-500 select-none">
      {/* Left: count summary + optional page-size picker */}
      <div className="flex items-center gap-3">
        <span>
          {totalItems === 0 ? "No results" : `${from}–${to} of ${totalItems}`}
        </span>
        {pageSizeOptions && onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            {pageSizeOptions.map((s) => (
              <option key={s} value={s}>
                {s} / page
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => go(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center justify-center h-8 rounded-md border border-gray-200 bg-white p-4 
              ${currentPage === 1 ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100 cursor-pointer'}`}
          aria-label="Previous page"
        >
          Previous
        </button>

        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="h-8 flex items-center justify-center text-gray-400"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => go(p)}
              className={`w-8 h-8 rounded-md border text-xs font-medium transition-colors
                ${
                  p === currentPage
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => go(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex items-center justify-center h-8 rounded-md border border-gray-200 bg-white p-4 
              ${currentPage === totalPages ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100 cursor-pointer'}`}
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  );
}

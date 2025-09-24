interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export function Pagination({ currentPage, totalPages, hasMore }: PaginationProps) {
  // Calculate page range to display (max 8 pages)
  const maxPagesToShow = 8;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  // Adjust start page if we're near the end
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages || !hasMore;

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      {/* Previous Button */}
      <a
        href={isFirstPage ? undefined : `/?page=${currentPage - 1}`}
        className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
          isFirstPage ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-neutral-100'
        }`}
        {...(isFirstPage && { 'aria-disabled': 'true' })}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </a>

      {/* First page if not in range */}
      {startPage > 1 && (
        <>
          <a href="/?page=1" className="w-8 h-8 flex items-center justify-center rounded-md text-gray-700 hover:bg-neutral-100 transition-colors">
            1
          </a>
          {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
        </>
      )}

      {/* Page numbers */}
      {pageNumbers.map((pageNum) => (
        <a
          key={pageNum}
          href={`/?page=${pageNum}`}
          className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
            pageNum === currentPage ? 'bg-neutral-800 text-white' : 'text-gray-700 hover:bg-neutral-100'
          }`}
        >
          {pageNum}
        </a>
      ))}

      {/* Last page if not in range */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
          <a href={`/?page=${totalPages}`} className="w-8 h-8 flex items-center justify-center rounded-md text-gray-700 hover:bg-neutral-100 transition-colors">
            {totalPages}
          </a>
        </>
      )}

      {/* Next Button */}
      <a
        href={isLastPage ? undefined : `/?page=${currentPage + 1}`}
        className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
          isLastPage ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-neutral-100'
        }`}
        {...(isLastPage && { 'aria-disabled': 'true' })}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  );
}

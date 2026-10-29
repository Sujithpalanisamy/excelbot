import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startEntry = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endEntry = Math.min(validCurrentPage * pageSize, totalItems);

  // Generate visible page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (validCurrentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (validCurrentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(validCurrentPage - 1);
        pages.push(validCurrentPage);
        pages.push(validCurrentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={`flex items-center justify-between flex-wrap gap-3 py-2.5 px-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-700 select-none ${className}`}>
      {/* Left side: Record Counts & Rows Per Page */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-medium text-slate-600">
          Showing <span className="font-bold text-slate-900">{startEntry}</span> to{' '}
          <span className="font-bold text-slate-900">{endEntry}</span> of{' '}
          <span className="font-bold text-slate-900">{totalItems}</span> entries
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300">
            <span className="text-slate-500 text-[11px]">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side: Navigation buttons */}
      <div className="flex items-center gap-1 font-mono">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={validCurrentPage <= 1}
          className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
          title="First Page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Prev Page */}
        <button
          type="button"
          onClick={() => onPageChange(validCurrentPage - 1)}
          disabled={validCurrentPage <= 1}
          className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 font-sans">
                  ...
                </span>
              );
            }
            const pageNum = Number(p);
            const isActive = pageNum === validCurrentPage;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[24px] h-6 px-1.5 rounded text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-[#1b365d] text-white shadow-2xs'
                    : 'bg-white border border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(validCurrentPage + 1)}
          disabled={validCurrentPage >= totalPages}
          className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
          title="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={validCurrentPage >= totalPages}
          className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
          title="Last Page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

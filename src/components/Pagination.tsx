'use client';

import React from 'react';

// Компактная пагинация: «< 1 … 4 5 6 … N >». Показывает до пяти номеров + многоточия.
function paginationRange(current: number, total: number): (number | 'dots')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | 'dots')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('dots');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('dots');
  pages.push(total);
  return pages;
}

interface PaginationProps {
  page: number;
  total: number;
  onChange: (page: number) => void;
  ariaLabel?: string;
}

export default function Pagination({
  page,
  total,
  onChange,
  ariaLabel = "Пагинация",
}: PaginationProps) {
  const range = paginationRange(page, total);
  const btnBase =
    'min-w-9 h-9 px-3 rounded-xl flex items-center justify-center text-xs font-black tracking-tight transition-colors border shadow-sm';
  
  if (total <= 1) return null;

  return (
    <nav
      aria-label={ariaLabel}
      className="mt-10 flex items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Предыдущая страница"
        className={`${btnBase} bg-surface text-on-surface border-on-surface/5 hover:border-on-surface/20 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-on-surface/5`}
      >
        <span className="material-symbols-rounded text-[18px]">chevron_left</span>
      </button>

      {range.map((p, idx) =>
        p === 'dots' ? (
          <span
            key={`dots-${idx}`}
            className="min-w-6 text-center text-on-surface-variant/40 text-xs font-black select-none"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`${btnBase} ${
              p === page
                ? 'bg-on-surface text-surface border-on-surface'
                : 'bg-surface text-on-surface border-on-surface/5 hover:border-on-surface/20'
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(Math.min(total, page + 1))}
        disabled={page === total}
        aria-label="Следующая страница"
        className={`${btnBase} bg-surface text-on-surface border-on-surface/5 hover:border-on-surface/20 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-on-surface/5`}
      >
        <span className="material-symbols-rounded text-[18px]">chevron_right</span>
      </button>
    </nav>
  );
}

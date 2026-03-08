'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface PaginationProps {
  currentPage: number
  totalPages: number
}

function PaginationInner({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  // Smart pagination: 1 ... [current-1, current, current+1] ... last
  const pages: (number | 'ellipsis')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('ellipsis')
    const rangeStart = Math.max(2, currentPage - 1)
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1)
    for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('ellipsis')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-center gap-3 mt-10 mb-4">
      {/* Previous button */}
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className="btn-ghost inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] disabled:opacity-25 disabled:pointer-events-none transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Prev
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span
              key={`ellipsis-${i}`}
              className="w-8 h-8 flex items-center justify-center text-[11px] text-[var(--text-tertiary)] select-none"
            >
              &hellip;
            </span>
          ) : (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-semibold transition-all ${
                p === currentPage
                  ? 'bg-[var(--brand)] text-white shadow-sm'
                  : 'btn-ghost text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      {/* Next button */}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="btn-ghost inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] disabled:opacity-25 disabled:pointer-events-none transition-colors"
      >
        Next
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Page indicator */}
      <span className="ml-2 text-[11px] text-[var(--text-tertiary)] tabular-nums hidden sm:inline">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  )
}

export function Pagination(props: PaginationProps) {
  return (
    <Suspense>
      <PaginationInner {...props} />
    </Suspense>
  )
}

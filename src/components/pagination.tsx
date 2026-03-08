'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface PaginationProps { currentPage: number; totalPages: number }

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

  const pages: (number | 'e')[] = []
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i) }
  else {
    pages.push(1)
    if (currentPage > 3) pages.push('e')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('e')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}
        className="w-7 h-7 flex items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-20 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      {pages.map((p, i) => p === 'e' ? (
        <span key={`e-${i}`} className="w-7 h-7 flex items-center justify-center text-[10px] text-[var(--text-tertiary)]">...</span>
      ) : (
        <button key={p} onClick={() => goToPage(p)}
          className={`w-7 h-7 flex items-center justify-center rounded text-[11px] font-medium transition-colors ${
            p === currentPage ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
          }`}>{p}</button>
      ))}
      <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}
        className="w-7 h-7 flex items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-20 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
      </button>
    </div>
  )
}

export function Pagination(props: PaginationProps) {
  return <Suspense><PaginationInner {...props} /></Suspense>
}

'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, useTransition } from 'react'

interface SetFilterProps {
  seriesList: string[]
  currentSeries?: string
  currentQuery?: string
  currentLang?: string
}

export function SetFilter({ seriesList, currentSeries, currentQuery, currentLang }: SetFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(currentQuery || '')

  function updateFilters(key: string, value: string) {
    const params = new URLSearchParams()
    // Always preserve lang from tabs
    if (currentLang) params.set('lang', currentLang)
    if (key === 'series' && value && value !== 'all') params.set('series', value)
    else if (key !== 'series' && currentSeries) params.set('series', currentSeries)
    if (key === 'q' && value) params.set('q', value)
    else if (key !== 'q' && search) params.set('q', search)
    params.set('page', '1')
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
      {/* Search input */}
      <div className="relative flex-1 sm:max-w-sm">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Search sets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updateFilters('q', search)
          }}
          className="input-premium w-full pl-9 pr-3 py-2 text-[13px]"
        />
      </div>

      {/* Series select */}
      <Select
        value={currentSeries || 'all'}
        onValueChange={(v) => updateFilters('series', v || 'all')}
      >
        <SelectTrigger className="sm:w-[200px] bg-[var(--surface-2)] border-[var(--border-default)] text-[13px] h-[38px]">
          <SelectValue placeholder="All Series" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Series</SelectItem>
          {seriesList.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* View toggle (visual only, grid default) */}
      <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
        <button className="p-1.5 rounded-md bg-[var(--surface-3)] text-[var(--text-primary)] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </button>
        <button className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 6h13" />
            <path d="M8 12h13" />
            <path d="M8 18h13" />
            <path d="M3 6h.01" />
            <path d="M3 12h.01" />
            <path d="M3 18h.01" />
          </svg>
        </button>
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="flex items-center gap-1.5 self-center">
          <div className="w-3 h-3 rounded-full border-2 border-[var(--brand)] border-t-transparent animate-spin" />
          <span className="text-[11px] text-[var(--text-tertiary)]">Filtering...</span>
        </div>
      )}
    </div>
  )
}

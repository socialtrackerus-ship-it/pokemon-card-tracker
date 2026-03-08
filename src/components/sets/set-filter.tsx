'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, useTransition } from 'react'

interface SetFilterProps { seriesList: string[]; currentSeries?: string; currentQuery?: string }

export function SetFilter({ seriesList, currentSeries, currentQuery }: SetFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(currentQuery || '')

  function updateFilters(key: string, value: string) {
    const params = new URLSearchParams()
    if (key === 'series' && value && value !== 'all') params.set('series', value)
    if (key === 'q' && value) params.set('q', value)
    if (key !== 'series' && currentSeries) params.set('series', currentSeries)
    if (key !== 'q' && search) params.set('q', search)
    params.set('page', '1')
    startTransition(() => { router.push(`${pathname}?${params.toString()}`) })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1 sm:max-w-xs">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          placeholder="Search sets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') updateFilters('q', search) }}
          className="w-full pl-9 pr-3 py-2 text-[13px] bg-[var(--surface-2)] border border-[var(--border-default)] rounded-md text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--brand)] transition-colors"
        />
      </div>
      <Select value={currentSeries || 'all'} onValueChange={(v) => updateFilters('series', v || 'all')}>
        <SelectTrigger className="sm:max-w-[180px] bg-[var(--surface-2)] border-[var(--border-default)] text-[13px]">
          <SelectValue placeholder="All Series" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Series</SelectItem>
          {seriesList.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
      {isPending && <span className="text-[11px] text-[var(--text-tertiary)] self-center">Loading...</span>}
    </div>
  )
}

'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, useTransition } from 'react'

interface SetFilterProps {
  seriesList: string[]
  currentSeries?: string
  currentQuery?: string
}

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

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative sm:max-w-xs flex-1">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
        >
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <Input
          placeholder="Search sets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updateFilters('q', search)
          }}
          className="pl-9 bg-white/5 border-white/10 focus:border-[var(--holo-purple)]/50 rounded-xl"
        />
      </div>
      <Select
        value={currentSeries || 'all'}
        onValueChange={(value) => updateFilters('series', value || 'all')}
      >
        <SelectTrigger className="sm:max-w-[200px] bg-white/5 border-white/10 rounded-xl">
          <SelectValue placeholder="All Series" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Series</SelectItem>
          {seriesList.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPending && (
        <div className="flex items-center gap-2 self-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--holo-purple)] animate-pulse" />
          <span className="text-xs text-muted-foreground">Loading...</span>
        </div>
      )}
    </div>
  )
}

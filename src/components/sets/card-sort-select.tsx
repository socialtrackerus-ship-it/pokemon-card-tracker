'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

const SORT_OPTIONS = [
  { value: 'price', label: 'Price (High to Low)' },
  { value: 'rarity', label: 'Rarity' },
  { value: 'number', label: 'Card Number' },
] as const

interface CardSortSelectProps {
  currentSort: string
}

export function CardSortSelect({ currentSort }: CardSortSelectProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', value)
    params.set('page', '1')
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex items-center gap-2">
      {isPending && (
        <div className="w-3 h-3 rounded-full border-2 border-[var(--brand)] border-t-transparent animate-spin" />
      )}
      <select
        value={currentSort}
        onChange={(e) => handleChange(e.target.value)}
        className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg px-3 py-1.5 text-[13px] text-[var(--text-primary)] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

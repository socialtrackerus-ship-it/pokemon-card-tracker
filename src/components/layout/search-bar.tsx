'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`/sets?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
      <div className="relative group">
        {/* Glow ring on focus */}
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[var(--holo-purple)] to-[var(--holo-blue)] opacity-0 group-focus-within:opacity-20 blur-sm transition-opacity duration-300" />

        <div className="relative flex items-center bg-white/[0.04] border border-white/[0.08] group-focus-within:border-white/[0.15] rounded-2xl transition-all duration-300 overflow-hidden">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="ml-4 text-muted-foreground/40 shrink-0"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cards, sets, or Pokemon..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 px-3 py-3.5 outline-none"
          />
          <button
            type="submit"
            className="mr-1.5 px-4 py-1.5 text-xs font-medium text-white rounded-xl bg-gradient-to-r from-[var(--holo-purple)] to-[var(--holo-blue)] hover:opacity-90 transition-opacity shrink-0"
          >
            Search
          </button>
        </div>
      </div>
    </form>
  )
}

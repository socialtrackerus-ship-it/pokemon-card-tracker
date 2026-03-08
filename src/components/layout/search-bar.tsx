'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function SearchBar({ size = 'default' }: { size?: 'default' | 'lg' }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`/sets?q=${encodeURIComponent(query.trim())}`)
    setFocused(false)
    inputRef.current?.blur()
  }

  // Keyboard shortcut
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const isLg = size === 'lg'

  return (
    <form onSubmit={handleSearch} className="relative w-full">
      <div className={`flex items-center surface-2 rounded-lg transition-all ${focused ? 'ring-1 ring-[var(--brand)] border-[var(--brand)]' : ''}`}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${isLg ? 'ml-4' : 'ml-3'} text-[var(--text-tertiary)] shrink-0`}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search cards, sets, Pokemon..."
          className={`flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none ${isLg ? 'px-3 py-3 text-sm' : 'px-2.5 py-2 text-[13px]'}`}
        />
        {!focused && !query && (
          <kbd className={`${isLg ? 'mr-3' : 'mr-2.5'} hidden sm:inline px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)] bg-[var(--surface-1)] border border-[var(--border-default)] rounded font-mono`}>
            /
          </kbd>
        )}
        {query && (
          <button type="submit" className={`${isLg ? 'mr-2' : 'mr-1.5'} px-3 py-1 text-[11px] font-medium text-white bg-[var(--brand)] rounded-md hover:opacity-90 transition-opacity`}>
            Search
          </button>
        )}
      </div>
    </form>
  )
}

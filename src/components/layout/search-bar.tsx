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

  // "/" keyboard shortcut
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
      <div
        className={`flex items-center rounded-xl transition-all duration-200 ${
          isLg
            ? 'surface-1 border-[var(--border-default)]'
            : 'surface-2'
        } ${
          focused
            ? 'ring-2 ring-[var(--brand)] border-[var(--brand)] shadow-[0_0_0_4px_var(--brand-subtle)]'
            : ''
        }`}
      >
        <svg
          width={isLg ? 18 : 15}
          height={isLg ? 18 : 15}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`${isLg ? 'ml-5' : 'ml-3'} shrink-0 transition-colors ${
            focused ? 'text-[var(--brand)]' : 'text-[var(--text-tertiary)]'
          }`}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search cards, sets, Pokemon..."
          className={`flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none ${
            isLg ? 'px-3 py-4 text-[15px]' : 'px-2.5 py-2 text-[13px]'
          }`}
        />
        {!focused && !query && (
          <kbd
            className={`${
              isLg ? 'mr-4' : 'mr-2.5'
            } hidden sm:inline-flex items-center justify-center w-6 h-6 text-[11px] text-[var(--text-tertiary)] bg-[var(--surface-2)] border border-[var(--border-default)] rounded-md font-mono`}
          >
            /
          </kbd>
        )}
        {query && (
          <button
            type="submit"
            className={`${
              isLg ? 'mr-3 px-5 py-2' : 'mr-2 px-3 py-1'
            } text-[12px] font-semibold text-white bg-[var(--brand)] rounded-lg hover:bg-[var(--brand-dim)] transition-colors`}
          >
            Search
          </button>
        )}
      </div>
    </form>
  )
}

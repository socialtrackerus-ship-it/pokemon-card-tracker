'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'

export function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const mainNav = [
    { href: '/sets', label: 'Sets' },
    { href: '/trending', label: 'Market' },
    ...(session
      ? [
          { href: '/collection', label: 'Collection' },
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/assistant', label: 'AI Tools' },
        ]
      : []),
  ]

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const userInitial = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : session?.user?.email
      ? session.user.email.charAt(0).toUpperCase()
      : '?'

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--surface-0)]/90 backdrop-blur-xl">
      <div className="container flex h-14 items-center gap-6">
        {/* Brand lockup */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="text-[var(--brand)] transition-transform duration-300 group-hover:rotate-12"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="3.5" fill="currentColor" />
            <circle cx="12" cy="12" r="2" fill="var(--surface-0)" />
            <line x1="2" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <line x1="15" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="text-[15px] font-semibold tracking-tight">
            Poke<span className="font-display">Vault</span>
          </span>
        </Link>

        {/* Main nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {mainNav.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-3 py-1.5 text-[13px] font-medium transition-colors"
              >
                <span
                  className={
                    active
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }
                >
                  {link.label}
                </span>
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-[var(--brand)]" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search trigger */}
        <Link
          href="/sets?focus=search"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-[12px] text-[var(--text-tertiary)] surface-2 rounded-lg hover:border-[var(--border-default)] transition-all cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span>Search...</span>
          <kbd className="ml-4 px-1.5 py-0.5 text-[10px] bg-[var(--surface-1)] border border-[var(--border-default)] rounded font-mono">
            /
          </kbd>
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {session ? (
            <>
              {/* Notification bell */}
              <button className="relative p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>

              {/* User avatar + dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[var(--brand-muted)] border border-[var(--border-brand)] flex items-center justify-center">
                    <span className="text-[11px] font-semibold brand-text">{userInitial}</span>
                  </div>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-[var(--text-tertiary)]"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 surface-1 rounded-lg overflow-hidden animate-fade z-50">
                    <div className="px-3 py-2.5 border-b border-[var(--border-subtle)]">
                      <p className="text-[12px] font-medium truncate">{session.user?.name || 'Collector'}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)] truncate">{session.user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-3 py-2 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/collection"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-3 py-2 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        My Collection
                      </Link>
                    </div>
                    <div className="border-t border-[var(--border-subtle)] py-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          signOut()
                        }}
                        className="w-full text-left px-3 py-2 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
              >
                Sign in
              </Link>
              <Link href="/auth/signup" className="btn-primary text-[13px] py-1.5 px-4">
                Get started
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors text-[var(--text-secondary)]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom gradient border */}
      <div
        className="h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, var(--border-default) 15%, var(--border-brand) 50%, var(--border-default) 85%, transparent 100%)',
        }}
      />

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden bg-[var(--surface-0)]/95 backdrop-blur-xl border-b border-[var(--border-subtle)] animate-fade">
          <div className="container py-3 flex flex-col gap-0.5">
            {mainNav.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`relative px-3 py-2.5 text-[13px] font-medium rounded-lg transition-colors ${
                    active
                      ? 'text-[var(--text-primary)] bg-[var(--surface-hover)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full bg-[var(--brand)]" />
                  )}
                  {link.label}
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </header>
  )
}

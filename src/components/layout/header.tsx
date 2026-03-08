'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

export function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const mainNav = [
    { href: '/sets', label: 'Sets' },
    { href: '/trending', label: 'Market' },
    ...(session ? [
      { href: '/collection', label: 'Collection' },
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/assistant', label: 'AI Tools' },
    ] : []),
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--surface-0)]/95 backdrop-blur-sm border-b border-[var(--border-subtle)]">
      <div className="container flex h-12 items-center gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[var(--brand)]">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
            <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span className="text-sm font-semibold tracking-tight">PokeVault</span>
        </Link>

        {/* Main nav */}
        <nav className="hidden md:flex items-center gap-1">
          {mainNav.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2.5 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                  active
                    ? 'text-[var(--text-primary)] bg-[var(--surface-active)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right */}
        <div className="flex items-center gap-2">
          {session ? (
            <>
              <span className="hidden lg:inline text-[11px] text-[var(--text-tertiary)] font-medium mr-1">{session.user?.email}</span>
              <button
                onClick={() => signOut()}
                className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1 rounded-md hover:bg-[var(--surface-hover)] transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2.5 py-1.5 rounded-md hover:bg-[var(--surface-hover)] transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="text-[12px] font-medium text-white px-3 py-1.5 rounded-md bg-[var(--brand)] hover:opacity-90 transition-opacity"
              >
                Get started
              </Link>
            </>
          )}

          {/* Mobile toggle */}
          <button
            className="md:hidden p-1.5 rounded-md hover:bg-[var(--surface-hover)] transition-colors text-[var(--text-secondary)]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-[var(--border-subtle)] bg-[var(--surface-0)] animate-fade">
          <div className="container py-2 flex flex-col">
            {mainNav.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2.5 text-[13px] font-medium rounded-md transition-colors ${
                    active
                      ? 'text-[var(--text-primary)] bg-[var(--surface-active)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
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

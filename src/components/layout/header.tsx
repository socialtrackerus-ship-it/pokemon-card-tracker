'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { href: '/sets', label: 'Sets', icon: <IconGrid /> },
    { href: '/trending', label: 'Trending', icon: <IconFlame /> },
    ...(session ? [
      { href: '/collection', label: 'Collection', icon: <IconFolder /> },
      { href: '/dashboard', label: 'Dashboard', icon: <IconChart /> },
      { href: '/assistant', label: 'AI', icon: <IconSpark /> },
    ] : []),
  ]

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass-strong">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--holo-purple)]/30 to-transparent" />
        <div className="container flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--holo-purple)] to-[var(--holo-blue)] shadow-[0_0_16px_oklch(0.6_0.2_280_/_20%)] group-hover:shadow-[0_0_24px_oklch(0.6_0.2_280_/_30%)] transition-shadow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2.5" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-gradient hidden sm:inline">PokeVault</span>
          </Link>

          {/* Center nav - pill style */}
          <nav className="hidden md:flex items-center gap-0.5 px-1.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200
                    ${isActive
                      ? 'text-white bg-gradient-to-r from-[var(--holo-purple)] to-[var(--holo-blue)] shadow-[0_0_12px_oklch(0.6_0.2_280_/_20%)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]'
                    }
                  `}
                >
                  <span className="w-3.5 h-3.5">{link.icon}</span>
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {session ? (
              <>
                <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-[11px] text-muted-foreground font-medium max-w-[140px] truncate">{session.user?.email}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="text-[11px] text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-full hover:bg-white/[0.05] transition-all"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <button className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full hover:bg-white/[0.05] transition-all">
                    Sign In
                  </button>
                </Link>
                <Link href="/auth/signup">
                  <button className="text-xs font-medium text-white px-4 py-1.5 rounded-full bg-gradient-to-r from-[var(--holo-purple)] to-[var(--holo-blue)] shadow-[0_0_16px_oklch(0.6_0.2_280_/_20%)] hover:shadow-[0_0_24px_oklch(0.6_0.2_280_/_30%)] transition-all">
                    Get Started
                  </button>
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/[0.05] transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileOpen && (
        <div className="md:hidden glass-strong border-t border-white/[0.06] animate-slide-up">
          <div className="container py-3 flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-all
                    ${isActive
                      ? 'text-white bg-gradient-to-r from-[var(--holo-purple)] to-[var(--holo-blue)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]'
                    }
                  `}
                >
                  <span className="w-4 h-4">{link.icon}</span>
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function IconFlame() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
      <path d="M12 2c.5 4-2 6-2 10a4 4 0 1 0 8 0c0-4-3-6-3-10M10 16a2 2 0 0 0 4 0c0-2-1.5-3-2-4-.5 1-2 2-2 4z" />
    </svg>
  )
}

function IconFolder() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h16z" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
      <path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 5-6" />
    </svg>
  )
}

function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
      <path d="M12 3v2m0 14v2M5.636 5.636l1.414 1.414m9.9 9.9l1.414 1.414M3 12h2m14 0h2M5.636 18.364l1.414-1.414m9.9-9.9l1.414-1.414" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const navLinks = [
    { href: '/sets', label: 'Sets' },
    { href: '/trending', label: 'Trending' },
    ...(session ? [
      { href: '/collection', label: 'Collection' },
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/assistant', label: 'AI Assistant' },
    ] : []),
  ]

  return (
    <header className="sticky top-0 z-50 w-full glass-strong">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--holo-purple)] to-transparent opacity-40" />
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2.5 mr-8 group">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--holo-purple)] to-[var(--holo-blue)] shadow-[0_0_20px_oklch(0.6_0.2_280_/_20%)] group-hover:shadow-[0_0_30px_oklch(0.6_0.2_280_/_35%)] transition-shadow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-gradient">
            PokeVault
          </span>
        </Link>

        <nav className="flex items-center gap-1 flex-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  relative px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive
                    ? 'text-foreground bg-[var(--holo-purple)]/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }
                `}
              >
                {link.label}
                {isActive && (
                  <span className="absolute inset-x-2 -bottom-[calc(0.5rem+1px)] h-0.5 rounded-full bg-gradient-to-r from-[var(--holo-purple)] to-[var(--holo-blue)]" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-muted-foreground font-medium">{session.user?.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-muted-foreground hover:text-foreground"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[var(--holo-purple)] to-[var(--holo-blue)] hover:opacity-90 text-white border-0 shadow-[0_0_20px_oklch(0.6_0.2_280_/_20%)] hover:shadow-[0_0_30px_oklch(0.6_0.2_280_/_30%)] transition-all"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

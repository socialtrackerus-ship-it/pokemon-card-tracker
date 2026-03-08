import Link from 'next/link'

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 mt-20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--holo-purple)] to-transparent opacity-20" />
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--holo-purple)] to-[var(--holo-blue)] opacity-60">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                  <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <span className="font-semibold text-muted-foreground">PokeVault</span>
            </div>
            <p className="text-sm text-muted-foreground/60 max-w-sm leading-relaxed">
              The ultimate platform for tracking, analyzing, and managing your Pokemon card collection with real-time market data.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Browse</h4>
            <div className="flex flex-col gap-2">
              <Link href="/sets" className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors">Sets</Link>
              <Link href="/trending" className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors">Trending</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Account</h4>
            <div className="flex flex-col gap-2">
              <Link href="/collection" className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors">Collection</Link>
              <Link href="/dashboard" className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors">Dashboard</Link>
              <Link href="/assistant" className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors">AI Assistant</Link>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground/40">
            Built with Pokemon TCG data. Not affiliated with The Pokemon Company.
          </p>
          <p className="text-xs text-muted-foreground/40">
            Prices from TCGPlayer. Updated daily.
          </p>
        </div>
      </div>
    </footer>
  )
}

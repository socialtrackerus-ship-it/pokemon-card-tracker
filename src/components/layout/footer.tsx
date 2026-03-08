import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] mt-16">
      <div className="container py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[var(--brand)]">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span className="text-xs font-semibold">PokeVault</span>
            </div>
            <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed max-w-[200px]">
              The collector's platform for Pokemon TCG. Real-time pricing, collection analytics, and grading intelligence.
            </p>
          </div>
          <div>
            <p className="text-label mb-3">Browse</p>
            <div className="flex flex-col gap-1.5">
              <Link href="/sets" className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Sets</Link>
              <Link href="/trending" className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Market</Link>
            </div>
          </div>
          <div>
            <p className="text-label mb-3">Account</p>
            <div className="flex flex-col gap-1.5">
              <Link href="/collection" className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Collection</Link>
              <Link href="/dashboard" className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Dashboard</Link>
              <Link href="/assistant" className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">AI Tools</Link>
            </div>
          </div>
          <div>
            <p className="text-label mb-3">Legal</p>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-[var(--text-tertiary)]">Not affiliated with The Pokemon Company</span>
              <span className="text-[11px] text-[var(--text-tertiary)]">Prices via TCGPlayer</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

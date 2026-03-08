import Link from 'next/link'

export function Footer() {
  return (
    <footer className="section-dark mt-16">
      {/* Top gradient border */}
      <div
        className="h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, var(--border-default) 20%, var(--border-brand) 50%, var(--border-default) 80%, transparent 100%)',
        }}
      />

      <div className="container py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="text-[var(--brand)]"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="3.5" fill="currentColor" />
                <circle cx="12" cy="12" r="2" fill="oklch(0.07 0.006 275)" />
                <line x1="2" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.5" />
                <line x1="15" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span className="text-[14px] font-semibold tracking-tight">
                Poke<span className="font-display">Vault</span>
              </span>
            </div>
            <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed mb-4 max-w-[220px]">
              The collector&rsquo;s edge. Real-time pricing, portfolio analytics, and grading intelligence for serious collectors.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                aria-label="Twitter"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                aria-label="Discord"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                aria-label="GitHub"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <p className="text-label mb-3">Platform</p>
            <div className="flex flex-col gap-2">
              <Link href="/sets" className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                Browse Sets
              </Link>
              <Link href="/trending" className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                Market Data
              </Link>
              <Link href="/cards" className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                Card Database
              </Link>
            </div>
          </div>

          {/* Account */}
          <div>
            <p className="text-label mb-3">Account</p>
            <div className="flex flex-col gap-2">
              <Link href="/collection" className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                My Collection
              </Link>
              <Link href="/dashboard" className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                Dashboard
              </Link>
              <Link href="/assistant" className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                AI Tools
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <p className="text-label mb-3">Resources</p>
            <div className="flex flex-col gap-2">
              <Link href="/auth/signup" className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                Create Account
              </Link>
              <span className="text-[12px] text-[var(--text-tertiary)]">API (coming soon)</span>
              <span className="text-[12px] text-[var(--text-tertiary)]">Changelog</span>
            </div>
          </div>

          {/* Legal */}
          <div>
            <p className="text-label mb-3">Legal</p>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                Not affiliated with Nintendo, The Pokemon Company, or Creatures Inc.
              </span>
              <span className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                Pokemon is a trademark of Nintendo.
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-[var(--border-subtle)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-[var(--text-tertiary)]">
              &copy; {new Date().getFullYear()} PokeVault. All rights reserved.
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)]">
              Prices sourced from TCGPlayer. Updated daily.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

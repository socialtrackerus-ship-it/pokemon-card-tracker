import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { SearchBar } from '@/components/layout/search-bar'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [
    recentSets,
    topCards,
    totalSets,
    totalCards,
    totalPriced,
  ] = await Promise.all([
    prisma.set.findMany({
      orderBy: { releaseDate: 'desc' },
      take: 6,
    }),
    prisma.cardPrice.findMany({
      where: { market: { not: null, gt: 5 } },
      orderBy: { market: 'desc' },
      take: 12,
      include: {
        card: {
          include: { set: { select: { name: true, id: true } } },
        },
      },
    }),
    prisma.set.count(),
    prisma.card.count(),
    prisma.cardPrice.count({ where: { market: { not: null } } }),
  ])

  // Split data for different sections
  const featuredCard = topCards[0] || null
  const marketLeaders = topCards.slice(1, 7)
  const marketTable = topCards.slice(0, 10)

  return (
    <div>
      {/* ═══════════════════════════════════════════
          SECTION 1 — ASYMMETRIC HERO
          Product-first. Not marketing-first.
          Left: brand + command. Right: featured card with live data.
          ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Ambient light — warm spot on the featured card side */}
        <div className="absolute top-0 right-0 w-[60%] h-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 80% at 70% 30%, oklch(0.82 0.11 75 / 3%), transparent 60%)' }} />
        <div className="absolute top-0 left-[20%] w-[40%] h-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 60% at 30% 60%, oklch(0.65 0.20 245 / 2.5%), transparent 60%)' }} />

        <div className="container-wide relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px] gap-10 lg:gap-16 items-center min-h-[calc(100vh-56px)] py-12 lg:py-0">

            {/* LEFT — Brand + Command + Actions */}
            <div className="animate-in max-w-xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--gain)]" />
                <span className="text-[11px] font-medium text-[var(--gain)] tracking-wide uppercase">Live market data</span>
              </div>

              <h1 className="font-display text-[clamp(2.5rem,5.5vw,4rem)] leading-[0.95] tracking-tight">
                Every card,<br />
                <span className="text-[var(--text-secondary)]">priced and tracked.</span>
              </h1>

              <p className="mt-5 text-[15px] text-[var(--text-secondary)] leading-relaxed max-w-md">
                Market prices across {totalPriced.toLocaleString()} variants. Grading ROI on every card.
                Portfolio analytics that show what your collection is actually worth.
              </p>

              {/* Command search */}
              <div className="mt-8">
                <SearchBar size="lg" />
              </div>

              {/* Quick actions — product entry points, not marketing */}
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href="/trending" className="btn-secondary text-[12px] px-4 py-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                  Market Data
                </Link>
                <Link href="/collection" className="btn-secondary text-[12px] px-4 py-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                  My Collection
                </Link>
                <Link href="/sets" className="btn-secondary text-[12px] px-4 py-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>
                  Browse Sets
                </Link>
              </div>

              {/* Trust stats — small, precise, not marketing fluff */}
              <div className="mt-8 flex items-center gap-5">
                <div>
                  <p className="text-value text-[18px] font-semibold">{totalCards.toLocaleString()}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">Cards</p>
                </div>
                <div className="w-px h-8 bg-[var(--border-subtle)]" />
                <div>
                  <p className="text-value text-[18px] font-semibold">{totalSets.toLocaleString()}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">Sets</p>
                </div>
                <div className="w-px h-8 bg-[var(--border-subtle)]" />
                <div>
                  <p className="text-value text-[18px] font-semibold">{totalPriced.toLocaleString()}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">Prices Tracked</p>
                </div>
              </div>
            </div>

            {/* RIGHT — Featured Card with Live Market Data */}
            {featuredCard && (
              <div className="animate-slide-right hidden lg:block">
                <Link href={`/cards/${featuredCard.cardId}`} className="block group">
                  <div className="relative">
                    {/* Ambient glow behind the card */}
                    <div className="absolute -inset-8 rounded-3xl pointer-events-none"
                      style={{ background: 'radial-gradient(ellipse at center, oklch(0.82 0.11 75 / 6%), transparent 70%)' }} />

                    {/* Card frame */}
                    <div className="relative card-frame-featured p-3">
                      <div className="relative aspect-[245/342] rounded-lg overflow-hidden">
                        <Image
                          src={featuredCard.card.imageSmall}
                          alt={featuredCard.card.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          sizes="440px"
                          priority
                        />
                      </div>
                    </div>

                    {/* Market data overlay — attached to the card, not floating */}
                    <div className="mt-4 px-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[16px] font-semibold">{featuredCard.card.name}</p>
                          <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">{featuredCard.card.set.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="price-tag-lg">${featuredCard.market!.toFixed(2)}</p>
                          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Market Price</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {featuredCard.card.rarity && (
                          <span className="gold-badge text-[10px] font-medium px-2 py-0.5 rounded">
                            {featuredCard.card.rarity}
                          </span>
                        )}
                        <span className="chip text-[10px]">{featuredCard.variant}</span>
                        <span className="text-[10px] text-[var(--text-tertiary)] ml-auto">
                          #{1} Most Valuable
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2 — MARKET INTELLIGENCE RAIL
          Dense, terminal-like. 4 columns. Not a ticker.
          ═══════════════════════════════════════════ */}
      <section style={{ background: 'oklch(0.07 0.006 275)' }}>
        <div className="section-divider" />
        <div className="container-wide py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border-subtle)] rounded-xl overflow-hidden">

            {/* Column 1 — Most Valuable */}
            <div className="bg-[oklch(0.085 0.006 275)] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--gold)]">Most Valuable</p>
                <Link href="/trending" className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">All &rarr;</Link>
              </div>
              <div className="space-y-2">
                {marketTable.slice(0, 5).map((item, i) => (
                  <Link key={`mv-${item.cardId}-${i}`} href={`/cards/${item.cardId}`}
                    className="flex items-center gap-2.5 py-1 group">
                    <span className="text-[10px] text-[var(--text-tertiary)] w-3 font-mono">{i + 1}</span>
                    <span className="text-[12px] font-medium truncate flex-1 group-hover:text-[var(--brand)] transition-colors">{item.card.name}</span>
                    <span className="price-tag text-[11px]">${item.market!.toFixed(2)}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Column 2 — Rarest Cards */}
            <div className="bg-[oklch(0.085 0.006 275)] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--rarity-ultra)]">Chase Cards</p>
                <Link href="/trending" className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">All &rarr;</Link>
              </div>
              <div className="space-y-2">
                {marketTable.slice(0, 5).map((item, i) => (
                  <Link key={`ch-${item.cardId}-${i}`} href={`/cards/${item.cardId}`}
                    className="flex items-center gap-2.5 py-1 group">
                    <div className="w-5 h-7 rounded-sm bg-[var(--surface-2)] overflow-hidden shrink-0 relative">
                      <Image src={item.card.imageSmall} alt="" fill className="object-cover" sizes="20px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium truncate group-hover:text-[var(--brand)] transition-colors">{item.card.name}</p>
                      <p className="text-[9px] text-[var(--text-tertiary)]">{item.card.rarity || 'Unknown'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Column 3 — Latest Sets */}
            <div className="bg-[oklch(0.085 0.006 275)] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand)]">Recent Sets</p>
                <Link href="/sets" className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">All &rarr;</Link>
              </div>
              <div className="space-y-2">
                {recentSets.slice(0, 5).map((set) => (
                  <Link key={set.id} href={`/sets/${set.id}`}
                    className="flex items-center gap-2.5 py-1 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium truncate group-hover:text-[var(--brand)] transition-colors">{set.name}</p>
                      <p className="text-[9px] text-[var(--text-tertiary)]">{set.series}</p>
                    </div>
                    <span className="text-[10px] text-[var(--text-tertiary)]">{set.printedTotal}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Column 4 — Platform Stats */}
            <div className="bg-[oklch(0.085 0.006 275)] p-4">
              <div className="mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--gain)]">Platform</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-secondary)]">Cards Indexed</span>
                  <span className="text-value text-[12px] font-semibold">{totalCards.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-secondary)]">Sets Tracked</span>
                  <span className="text-value text-[12px] font-semibold">{totalSets.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-secondary)]">Price Points</span>
                  <span className="text-value text-[12px] font-semibold">{totalPriced.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-secondary)]">Top Card</span>
                  <span className="price-tag text-[12px]">${topCards[0]?.market?.toFixed(2) || '—'}</span>
                </div>
                <div className="mt-1 pt-2 border-t border-[var(--border-subtle)]">
                  <Link href="/auth/signup" className="text-[11px] font-medium text-[var(--brand)] hover:underline">
                    Create free account &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3 — EDITORIAL FEATURE
          Asymmetric. Left: hero card. Right: stacked insights.
          Feels like a magazine crossed with a market terminal.
          ═══════════════════════════════════════════ */}
      <section className="section-warm">
        <div className="container py-16 lg:py-20">
          <div className="flex items-baseline justify-between mb-8">
            <div>
              <p className="text-eyebrow mb-1">Market Leaders</p>
              <h2 className="text-display-lg">Highest Value Cards</h2>
            </div>
            <Link href="/trending" className="btn-ghost text-[12px]">View full market &rarr;</Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6 lg:gap-8">
            {/* LEFT — Featured card (large) */}
            {featuredCard && (
              <Link href={`/cards/${featuredCard.cardId}`} className="group">
                <div className="panel h-full">
                  <div className="p-5 flex flex-col sm:flex-row gap-5 h-full">
                    <div className="relative w-full sm:w-[200px] shrink-0">
                      <div className="card-frame-featured p-2">
                        <div className="relative aspect-[245/342] rounded-lg overflow-hidden">
                          <Image
                            src={featuredCard.card.imageSmall}
                            alt={featuredCard.card.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            sizes="200px"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <span className="badge-premium">#1 Market Leader</span>
                        <h3 className="text-display-md mt-3">{featuredCard.card.name}</h3>
                        <p className="text-[12px] text-[var(--text-tertiary)] mt-1">{featuredCard.card.set.name} &middot; {featuredCard.card.rarity || 'Rare'}</p>
                      </div>
                      <div className="mt-4">
                        <p className="price-tag-lg">${featuredCard.market!.toFixed(2)}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)] mt-1">TCGPlayer Market</p>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <span className="chip text-[10px]">{featuredCard.variant}</span>
                        {featuredCard.low && <span className="text-[10px] text-[var(--text-tertiary)]">Low: ${featuredCard.low.toFixed(2)}</span>}
                        {featuredCard.high && <span className="text-[10px] text-[var(--text-tertiary)]">High: ${featuredCard.high.toFixed(2)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* RIGHT — Market table (dense, ranked) */}
            <div className="panel">
              <div className="panel-header">
                <span className="text-[13px] font-semibold">Top 10 by Market Price</span>
                <span className="text-label">{marketTable.length} cards</span>
              </div>
              <div className="panel-body-flush">
                <div className="overflow-y-auto max-h-[440px]">
                  {marketTable.map((item, i) => (
                    <Link key={`mt-${item.cardId}-${item.variant}-${i}`} href={`/cards/${item.cardId}`}
                      className={`flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--surface-hover)] ${i === 0 ? 'bg-[oklch(0.82_0.11_75_/_2%)]' : ''}`}>
                      <span className="text-value text-[11px] text-[var(--text-tertiary)] w-5 text-right font-mono">{i + 1}</span>
                      <div className="w-7 h-10 rounded-sm bg-[var(--surface-2)] overflow-hidden shrink-0 relative">
                        <Image src={item.card.imageSmall} alt="" fill className="object-cover" sizes="28px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium truncate">{item.card.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-[var(--text-tertiary)]">{item.card.set.name}</span>
                          <span className="text-[9px] text-[var(--text-tertiary)]">&middot;</span>
                          <span className="text-[9px] text-[var(--text-tertiary)] capitalize">{item.variant}</span>
                        </div>
                      </div>
                      <span className="price-tag text-[13px] font-semibold">${item.market!.toFixed(2)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 4 — PRODUCT DEPTH BENTO
          Mixed-size grid. Each cell shows a real product capability
          with a visual preview, not a marketing paragraph.
          ═══════════════════════════════════════════ */}
      <section className="container py-16 lg:py-20">
        <div className="mb-8">
          <p className="text-eyebrow mb-1">Platform</p>
          <h2 className="text-display-lg">What collectors use PokeVault for</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Large cell — Portfolio Tracking */}
          <div className="lg:col-span-2 surface-premium rounded-xl p-6 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-[var(--brand-muted)] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                </div>
                <span className="text-[13px] font-semibold">Portfolio Tracking</span>
              </div>
              <p className="text-[12px] text-[var(--text-secondary)] max-w-sm leading-relaxed mb-5">
                Watch your collection value in real time. Breakdowns by set, rarity, and grade. Know exactly what you own and what it&rsquo;s worth.
              </p>
              {/* Visual preview — mini chart */}
              <div className="flex items-end gap-1 h-16">
                {[28, 32, 30, 38, 35, 42, 40, 48, 45, 52, 50, 58, 55, 62, 64, 60, 68, 72, 70, 78].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm transition-all"
                    style={{
                      height: `${h}%`,
                      background: i >= 16 ? 'var(--gold)' : 'var(--brand)',
                      opacity: 0.15 + (i / 20) * 0.85,
                    }} />
                ))}
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-metric-sm gold-text">$2,847.50</span>
                <span className="text-[11px] gain-text">+12.4%</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">30d</span>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-1/3 h-full pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at top right, oklch(0.65 0.20 245 / 4%), transparent 70%)' }} />
          </div>

          {/* Grading Intelligence */}
          <div className="surface-premium rounded-xl p-6 group">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-[var(--gold-muted)] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
              </div>
              <span className="text-[13px] font-semibold">Grading Intelligence</span>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mb-4">
              PSA, BGS, CGC profit analysis. Know which cards to submit before you spend.
            </p>
            {/* Visual preview — grading ROI */}
            <div className="space-y-2 mt-auto">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-tertiary)]">Raw Price</span>
                <span className="text-value">$48.00</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-tertiary)]">PSA 10 Value</span>
                <span className="text-value gold-text">$340.00</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-tertiary)]">Grading Cost</span>
                <span className="text-value">-$50.00</span>
              </div>
              <div className="border-t border-[var(--border-subtle)] pt-2 flex items-center justify-between text-[11px]">
                <span className="font-medium">Potential ROI</span>
                <span className="text-value font-semibold gain-text">+$242.00</span>
              </div>
            </div>
          </div>

          {/* Set Completion */}
          <div className="surface-premium rounded-xl p-6 group">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-[var(--brand-muted)] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
              </div>
              <span className="text-[13px] font-semibold">Set Completion</span>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mb-4">
              Track which cards you own in every set. See exactly what you&rsquo;re missing.
            </p>
            {/* Visual preview — progress bars */}
            <div className="space-y-2.5">
              {[
                { name: 'Obsidian Flames', pct: 78 },
                { name: 'Paldea Evolved', pct: 45 },
                { name: '151', pct: 92 },
              ].map((s) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium">{s.name}</span>
                    <span className="text-[10px] text-value text-[var(--text-tertiary)]">{s.pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill progress-bar-fill-brand" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Watchlists */}
          <div className="surface-premium rounded-xl p-6 group">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-[oklch(0.65_0.20_245_/_8%)] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              </div>
              <span className="text-[13px] font-semibold">Watchlists &amp; Alerts</span>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mb-4">
              Follow cards and sets. Get notified when prices move past your thresholds.
            </p>
            {/* Visual preview — watchlist items */}
            <div className="space-y-2">
              {[
                { name: 'Charizard VMAX', price: '$189.50', trend: '+5.2%', up: true },
                { name: 'Umbreon VMAX', price: '$156.00', trend: '-2.1%', up: false },
                { name: 'Pikachu VMAX', price: '$78.00', trend: '+8.4%', up: true },
              ].map((w) => (
                <div key={w.name} className="flex items-center gap-2 text-[11px]">
                  <div className={`w-1.5 h-1.5 rounded-full ${w.up ? 'bg-[var(--gain)]' : 'bg-[var(--loss)]'}`} />
                  <span className="flex-1 truncate font-medium">{w.name}</span>
                  <span className="text-value text-[var(--text-secondary)]">{w.price}</span>
                  <span className={`text-value text-[10px] ${w.up ? 'gain-text' : 'loss-text'}`}>{w.trend}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Tools */}
          <div className="surface-premium rounded-xl p-6 group">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-[oklch(0.70_0.15_155_/_8%)] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gain)" strokeWidth="2"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>
              </div>
              <span className="text-[13px] font-semibold">AI Card Advisor</span>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mb-4">
              Ask about any card. Get pricing, grading advice, collection analysis, and market trends instantly.
            </p>
            {/* Visual preview — chat bubbles */}
            <div className="space-y-2">
              <div className="bg-[var(--brand)] text-white text-[10px] px-3 py-1.5 rounded-lg rounded-br-sm max-w-[80%] ml-auto">
                Should I grade my Charizard?
              </div>
              <div className="bg-[var(--surface-3)] text-[10px] px-3 py-1.5 rounded-lg rounded-bl-sm max-w-[85%]">
                Your Charizard VMAX (raw ~$189) could be worth $450+ as a PSA 10. With grading costs of ~$50, that&rsquo;s a strong ROI.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 5 — LATEST RELEASES
          Not a uniform grid. Staggered prominence.
          Newest set is largest, others are secondary.
          ═══════════════════════════════════════════ */}
      {recentSets.length > 0 && (
        <section className="section-elevated">
          <div className="section-divider" />
          <div className="container py-16 lg:py-20">
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <p className="text-eyebrow mb-1">New Releases</p>
                <h2 className="text-display-lg">Latest Sets</h2>
              </div>
              <Link href="/sets" className="btn-ghost text-[12px]">All sets &rarr;</Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr_1fr] gap-4">
              {/* Featured (newest) set — larger treatment */}
              {recentSets[0] && (
                <Link href={`/sets/${recentSets[0].id}`}
                  className="group surface-brand rounded-xl p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden">
                  <div className="relative z-10">
                    {recentSets[0].logoUrl && (
                      <div className="relative h-12 w-full mb-4">
                        <Image src={recentSets[0].logoUrl} alt={recentSets[0].name} fill className="object-contain object-left" sizes="300px" />
                      </div>
                    )}
                    <h3 className="text-display-sm">{recentSets[0].name}</h3>
                    <p className="text-[12px] text-[var(--text-tertiary)] mt-1">{recentSets[0].series}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-4 relative z-10">
                    <span className="text-[11px] text-[var(--text-secondary)]">{recentSets[0].printedTotal} cards</span>
                    {recentSets[0].releaseDate && (
                      <span className="text-[11px] text-[var(--text-tertiary)]">{format(new Date(recentSets[0].releaseDate), 'MMMM yyyy')}</span>
                    )}
                    <span className="chip text-[10px] ml-auto">New</span>
                  </div>
                </Link>
              )}

              {/* Secondary sets — two more */}
              {recentSets.slice(1, 3).map((set) => (
                <Link key={set.id} href={`/sets/${set.id}`}
                  className="group surface-interactive rounded-xl p-5 flex flex-col justify-between min-h-[220px]">
                  {set.logoUrl && (
                    <div className="relative h-10 w-full mb-3">
                      <Image src={set.logoUrl} alt={set.name} fill className="object-contain object-left" sizes="200px" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-[14px] font-semibold">{set.name}</h3>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{set.series}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-[10px] text-[var(--text-secondary)]">{set.printedTotal} cards</span>
                    {set.releaseDate && (
                      <span className="text-[10px] text-[var(--text-tertiary)]">{format(new Date(set.releaseDate), 'MMM yyyy')}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Remaining sets — compact row */}
            {recentSets.length > 3 && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                {recentSets.slice(3, 6).map((set) => (
                  <Link key={set.id} href={`/sets/${set.id}`}
                    className="surface-interactive rounded-lg p-3 flex items-center gap-3">
                    {set.logoUrl && (
                      <div className="relative h-6 w-12 shrink-0">
                        <Image src={set.logoUrl} alt={set.name} fill className="object-contain" sizes="48px" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium truncate">{set.name}</p>
                      <p className="text-[9px] text-[var(--text-tertiary)]">{set.printedTotal} cards</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          SECTION 6 — SHOWCASE PREVIEW
          Emotional. Visual. Shows the collection/binder experience.
          A grid of cards displayed as if in a premium display case.
          ═══════════════════════════════════════════ */}
      {marketLeaders.length > 0 && (
        <section className="container py-16 lg:py-20">
          <div className="flex items-baseline justify-between mb-8">
            <div>
              <p className="text-eyebrow mb-1">Showcase</p>
              <h2 className="text-display-lg">The Vault</h2>
              <p className="text-[13px] text-[var(--text-secondary)] mt-2 max-w-md">
                Your most prized cards, beautifully displayed. Build your collection and showcase your best pulls.
              </p>
            </div>
            <Link href="/collection" className="btn-ghost text-[12px]">My collection &rarr;</Link>
          </div>

          {/* Display case grid — feels like a physical collector shelf */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {marketLeaders.map((item, i) => (
              <Link key={`sc-${item.cardId}-${i}`} href={`/cards/${item.cardId}`} className="group">
                <div className={`${i === 0 || i === 3 ? 'card-frame-featured' : 'card-frame'} p-1.5`}>
                  <div className="relative aspect-[245/342] rounded-md overflow-hidden">
                    <Image
                      src={item.card.imageSmall}
                      alt={item.card.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      sizes="(max-width: 640px) 30vw, (max-width: 1024px) 22vw, 180px"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className="mt-2 px-0.5">
                  <p className="text-[10px] font-medium truncate">{item.card.name}</p>
                  <p className="price-tag text-[10px]">${item.market!.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          SECTION 7 — FINAL CTA
          Not generic. Integrated into brand.
          Feels like a vault invitation.
          ═══════════════════════════════════════════ */}
      <section className="section-dark">
        <div className="section-divider" />
        <div className="container py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-center">
            <div>
              <p className="text-eyebrow mb-2">Free forever</p>
              <h2 className="text-display-xl max-w-lg">
                Your collection deserves better than a spreadsheet.
              </h2>
              <p className="text-[14px] text-[var(--text-secondary)] mt-4 max-w-md leading-relaxed">
                {totalCards.toLocaleString()} cards indexed. {totalSets.toLocaleString()} sets tracked. Every price, every variant, every grade. Start building your vault today.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/auth/signup" className="btn-primary text-[14px] px-7 py-3.5">
                Create free account
              </Link>
              <Link href="/trending" className="btn-secondary text-[14px] px-7 py-3.5">
                Explore the market
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

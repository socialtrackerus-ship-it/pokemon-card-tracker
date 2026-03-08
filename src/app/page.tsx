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
    recentlyPriced,
    totalSets,
    totalCards,
    seriesListRaw,
  ] = await Promise.all([
    prisma.set.findMany({
      orderBy: { releaseDate: 'desc' },
      take: 8,
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
    prisma.cardPrice.findMany({
      where: { market: { not: null } },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        card: {
          include: { set: { select: { name: true, id: true } } },
        },
      },
    }),
    prisma.set.count(),
    prisma.card.count(),
    prisma.set.findMany({
      select: { series: true },
      distinct: ['series'],
      orderBy: { releaseDate: 'desc' },
      take: 12,
    }),
  ])

  const seriesList = seriesListRaw.map(s => s.series)

  return (
    <div>
      {/* ═══ SEARCH + BROWSE BAR ═══
          The first thing people see. Immediately useful.
          No hero text. No marketing. Just search + browse entry points. */}
      <section className="border-b border-[var(--border-subtle)]">
        <div className="container py-5">
          <div className="max-w-2xl">
            <SearchBar size="lg" />
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-[11px] text-[var(--text-tertiary)]">Browse:</span>
            {['Charizard', 'Pikachu', 'Mewtwo', 'Lugia', 'Umbreon', 'Mew', 'Rayquaza', 'Gengar'].map((name) => (
              <Link key={name} href={`/sets?q=${name}`}
                className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-0.5 rounded bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                {name}
              </Link>
            ))}
            <Link href="/sets" className="text-[11px] text-[var(--brand)] hover:underline ml-1">All sets &rarr;</Link>
          </div>
        </div>
      </section>

      {/* ═══ MAIN CONTENT — 2-column discovery layout ═══
          Left: primary content (cards, sets)
          Right: sidebar (market data, browse links)
          Content-dense. Every element is clickable and leads deeper. */}
      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

          {/* ═══ LEFT COLUMN — Primary content ═══ */}
          <div className="space-y-8">

            {/* TOP MARKET VALUE — the main draw */}
            {topCards.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-[15px] font-semibold">Top Market Value</h2>
                  <Link href="/trending" className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors">
                    View all &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {topCards.slice(0, 8).map((item, i) => (
                    <Link key={`top-${item.cardId}-${item.variant}-${i}`} href={`/cards/${item.cardId}`} className="group">
                      <div className="card-frame p-1.5">
                        <div className="relative aspect-[245/342] rounded-md overflow-hidden bg-[var(--surface-2)]">
                          <Image
                            src={item.card.imageSmall}
                            alt={item.card.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 28vw, 200px"
                            priority={i < 4}
                          />
                          {/* Price overlay */}
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-value gold-text"
                            style={{ background: 'oklch(0.085 0.006 275 / 85%)', backdropFilter: 'blur(4px)' }}>
                            ${item.market!.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-1.5 px-0.5">
                        <p className="text-[11px] font-medium truncate group-hover:text-[var(--brand)] transition-colors">{item.card.name}</p>
                        <p className="text-[9px] text-[var(--text-tertiary)] truncate">{item.card.set.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* LATEST SETS */}
            {recentSets.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-[15px] font-semibold">Latest Sets</h2>
                  <Link href="/sets" className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors">
                    All sets &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {recentSets.slice(0, 4).map((set) => (
                    <Link key={set.id} href={`/sets/${set.id}`}
                      className="group surface-interactive rounded-lg p-3">
                      {set.logoUrl && (
                        <div className="relative h-8 w-full mb-2">
                          <Image src={set.logoUrl} alt={set.name} fill className="object-contain object-left" sizes="160px" />
                        </div>
                      )}
                      <p className="text-[12px] font-medium truncate group-hover:text-[var(--brand)] transition-colors">{set.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[var(--text-tertiary)]">{set.printedTotal} cards</span>
                        {set.releaseDate && (
                          <span className="text-[10px] text-[var(--text-tertiary)]">{format(new Date(set.releaseDate), 'MMM yyyy')}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                {/* Secondary sets — compact list */}
                <div className="mt-2 panel">
                  <div className="panel-body-flush">
                    {recentSets.slice(4, 8).map((set, i) => (
                      <Link key={set.id} href={`/sets/${set.id}`}
                        className={`flex items-center gap-3 px-3 py-2 hover:bg-[var(--surface-hover)] transition-colors ${i < 3 ? 'border-b border-[var(--border-subtle)]' : ''}`}>
                        {set.logoUrl && (
                          <div className="relative h-5 w-10 shrink-0">
                            <Image src={set.logoUrl} alt={set.name} fill className="object-contain" sizes="40px" />
                          </div>
                        )}
                        <span className="text-[11px] font-medium truncate flex-1">{set.name}</span>
                        <span className="text-[10px] text-[var(--text-tertiary)]">{set.printedTotal} cards</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* MORE VALUABLE CARDS — second card grid */}
            {topCards.length > 8 && (
              <section>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-[15px] font-semibold">Also Trending</h2>
                  <Link href="/trending" className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors">
                    Full market &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {topCards.slice(8, 12).map((item, i) => (
                    <Link key={`more-${item.cardId}-${item.variant}-${i}`} href={`/cards/${item.cardId}`} className="group">
                      <div className="card-frame p-1.5">
                        <div className="relative aspect-[245/342] rounded-md overflow-hidden bg-[var(--surface-2)]">
                          <Image
                            src={item.card.imageSmall}
                            alt={item.card.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                            sizes="200px"
                            loading="lazy"
                          />
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-value gold-text"
                            style={{ background: 'oklch(0.085 0.006 275 / 85%)', backdropFilter: 'blur(4px)' }}>
                            ${item.market!.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-1.5 px-0.5">
                        <p className="text-[11px] font-medium truncate group-hover:text-[var(--brand)] transition-colors">{item.card.name}</p>
                        <p className="text-[9px] text-[var(--text-tertiary)] truncate">{item.card.set.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* BROWSE BY SERIES — internal linking for discovery */}
            <section>
              <h2 className="text-[15px] font-semibold mb-3">Browse by Series</h2>
              <div className="flex flex-wrap gap-2">
                {seriesList.map((s) => (
                  <Link key={s} href={`/sets?series=${encodeURIComponent(s)}`}
                    className="text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-lg surface-interactive transition-all">
                    {s}
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* ═══ RIGHT COLUMN — Sidebar ═══ */}
          <aside className="space-y-5">

            {/* RECENTLY UPDATED PRICES */}
            {recentlyPriced.length > 0 && (
              <div className="panel">
                <div className="panel-header">
                  <span className="text-[12px] font-semibold">Recently Updated</span>
                  <Link href="/trending" className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--brand)]">All &rarr;</Link>
                </div>
                <div className="panel-body-flush">
                  {recentlyPriced.map((item, i) => (
                    <Link key={`rp-${item.cardId}-${item.variant}-${i}`} href={`/cards/${item.cardId}`}
                      className={`flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--surface-hover)] transition-colors ${i < recentlyPriced.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''}`}>
                      <div className="w-6 h-8 rounded-sm bg-[var(--surface-2)] overflow-hidden shrink-0 relative">
                        <Image src={item.card.imageSmall} alt="" fill className="object-cover" sizes="24px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate">{item.card.name}</p>
                        <p className="text-[9px] text-[var(--text-tertiary)] truncate">{item.card.set.name}</p>
                      </div>
                      <span className="price-tag text-[11px]">${item.market!.toFixed(2)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* QUICK STATS */}
            <div className="panel">
              <div className="panel-header">
                <span className="text-[12px] font-semibold">Database</span>
              </div>
              <div className="panel-body">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-secondary)]">Cards indexed</span>
                    <span className="text-value text-[12px] font-semibold">{totalCards.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-secondary)]">Sets tracked</span>
                    <span className="text-value text-[12px] font-semibold">{totalSets.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-secondary)]">Most valuable</span>
                    <span className="price-tag text-[12px]">${topCards[0]?.market?.toFixed(2) || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* GRADING PICKS — cards worth grading */}
            {topCards.length > 0 && (
              <div className="panel">
                <div className="panel-header">
                  <span className="text-[12px] font-semibold">Grading Picks</span>
                  <Link href="/assistant" className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--brand)]">AI Tools &rarr;</Link>
                </div>
                <div className="panel-body">
                  <p className="text-[10px] text-[var(--text-tertiary)] mb-3">Cards with strong grading potential based on market value.</p>
                  <div className="space-y-2">
                    {topCards.slice(0, 4).map((item, i) => (
                      <Link key={`gp-${item.cardId}-${i}`} href={`/cards/${item.cardId}`}
                        className="flex items-center gap-2 group">
                        <div className="w-5 h-7 rounded-sm bg-[var(--surface-2)] overflow-hidden shrink-0 relative">
                          <Image src={item.card.imageSmall} alt="" fill className="object-cover" sizes="20px" />
                        </div>
                        <span className="text-[11px] font-medium truncate flex-1 group-hover:text-[var(--brand)] transition-colors">{item.card.name}</span>
                        <span className="text-[10px] text-[var(--text-tertiary)]">{item.card.rarity || ''}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* BROWSE LINKS — deep linking for SEO and discovery */}
            <div className="panel">
              <div className="panel-header">
                <span className="text-[12px] font-semibold">Explore</span>
              </div>
              <div className="panel-body">
                <div className="space-y-1">
                  {[
                    { label: 'Browse all sets', href: '/sets' },
                    { label: 'Market overview', href: '/trending' },
                    { label: 'AI card advisor', href: '/assistant' },
                  ].map((link) => (
                    <Link key={link.href} href={link.href}
                      className="flex items-center justify-between py-1.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors group">
                      <span>{link.label}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* SIGN UP — subtle, not a CTA block */}
            <div className="px-3 py-3 rounded-lg bg-[var(--brand-subtle)] border border-[var(--border-brand)]">
              <p className="text-[11px] font-medium mb-1">Track your collection</p>
              <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed mb-2">
                Create a free account to save cards, build watchlists, and track your portfolio value.
              </p>
              <Link href="/auth/signup" className="text-[11px] font-medium text-[var(--brand)] hover:underline">
                Sign up free &rarr;
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

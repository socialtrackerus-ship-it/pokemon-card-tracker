import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { SearchBar } from '@/components/layout/search-bar'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [recentSets, topCards, tickerCards] = await Promise.all([
    prisma.set.findMany({
      orderBy: { releaseDate: 'desc' },
      take: 4,
    }),
    prisma.cardPrice.findMany({
      where: { market: { not: null, gt: 5 } },
      orderBy: { market: 'desc' },
      take: 6,
      include: {
        card: {
          include: { set: { select: { name: true } } },
        },
      },
    }),
    prisma.cardPrice.findMany({
      where: { market: { not: null, gt: 10 } },
      orderBy: { market: 'desc' },
      take: 10,
      include: {
        card: {
          include: { set: { select: { name: true } } },
        },
      },
    }),
  ])

  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section className="section-hero">
        <div className="container pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="max-w-3xl mx-auto text-center animate-in">
            <h1 className="text-display-hero">
              The Definitive Platform
              <br />
              for Pokemon Card Collectors
            </h1>
            <p className="mt-6 text-[15px] text-[var(--text-secondary)] max-w-lg mx-auto leading-relaxed">
              Real-time market intelligence. Portfolio analytics.
              Grading optimization. Built for serious collectors.
            </p>

            {/* Search */}
            <div className="mt-10 max-w-xl mx-auto">
              <SearchBar size="lg" />
            </div>

            {/* Quick stats strip */}
            <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
              {['50,000+ Cards', '900+ Sets', 'Live Pricing', 'Free Forever'].map(
                (stat, i, arr) => (
                  <span key={stat} className="flex items-center gap-3">
                    <span className="text-label">{stat}</span>
                    {i < arr.length - 1 && (
                      <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]" />
                    )}
                  </span>
                )
              )}
            </div>

            {/* Popular search tags */}
            <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
              <span className="text-[11px] text-[var(--text-tertiary)] mr-1">Popular:</span>
              {['Charizard', 'Pikachu', 'Mewtwo', 'Lugia', 'Umbreon'].map((name) => (
                <Link key={name} href={`/sets?q=${name}`} className="chip">
                  {name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MARKET TICKER ═══ */}
      {tickerCards.length > 0 && (
        <section className="section-elevated py-3">
          <div className="section-divider mb-3" />
          <div className="ticker-wrap">
            <div className="ticker-track">
              {/* Duplicate for seamless loop */}
              {[...tickerCards, ...tickerCards].map((item, i) => (
                <Link
                  key={`${item.cardId}-${item.variant}-${i}`}
                  href={`/cards/${item.cardId}`}
                  className="flex items-center gap-3 px-6 py-1 shrink-0 hover:bg-[var(--surface-hover)] transition-colors rounded"
                >
                  <span className="text-[12px] font-medium text-[var(--text-primary)] whitespace-nowrap">
                    {item.card.name}
                  </span>
                  <span className="price-tag text-[12px]">
                    ${item.market!.toFixed(2)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
          <div className="section-divider mt-3" />
        </section>
      )}

      {/* ═══ FEATURED CHASE CARDS ═══ */}
      {topCards.length > 0 && (
        <section className="container py-16 md:py-20">
          <div className="module-header mb-6">
            <div>
              <p className="text-eyebrow mb-2">Market Leaders</p>
              <h2 className="text-display-lg">Top Market Value</h2>
            </div>
            <Link
              href="/trending"
              className="text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              View all market data &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 stagger">
            {topCards.map((item, i) => (
              <Link
                key={`${item.cardId}-${item.variant}-${i}`}
                href={`/cards/${item.cardId}`}
                className="group"
              >
                <div className="card-frame-featured">
                  <div className="relative aspect-[245/342] rounded-lg overflow-hidden bg-[var(--surface-2)]">
                    <Image
                      src={item.card.imageSmall}
                      alt={item.card.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
                    />
                  </div>
                  <div className="mt-2.5 px-0.5">
                    <p className="text-[12px] font-medium truncate text-[var(--text-primary)]">
                      {item.card.name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-[var(--text-tertiary)] truncate">
                        {item.card.set.name}
                      </span>
                      <span className="price-tag text-[13px]">
                        ${item.market!.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══ NEW RELEASES ═══ */}
      {recentSets.length > 0 && (
        <section className="section-warm">
          <div className="container py-16 md:py-20">
            <div className="module-header mb-6">
              <div>
                <p className="text-eyebrow mb-2">New Releases</p>
                <h2 className="text-display-lg">Latest Sets</h2>
              </div>
              <Link
                href="/sets"
                className="text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Explore all sets &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
              {recentSets.map((set) => (
                <Link
                  key={set.id}
                  href={`/sets/${set.id}`}
                  className="group surface-interactive rounded-xl p-5 flex flex-col items-center text-center"
                >
                  {set.logoUrl && (
                    <div className="relative w-full h-12 mb-4">
                      <Image
                        src={set.logoUrl}
                        alt={set.name}
                        fill
                        className="object-contain"
                        sizes="240px"
                      />
                    </div>
                  )}
                  <h3 className="text-[14px] font-semibold text-[var(--text-primary)] truncate w-full">
                    {set.name}
                  </h3>
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                    {set.series}
                  </p>
                  <div className="mt-4 flex items-center gap-4">
                    <span className="text-[11px] text-[var(--text-secondary)]">
                      {set.printedTotal} cards
                    </span>
                    {set.releaseDate && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                        <span className="text-[11px] text-[var(--text-tertiary)]">
                          {format(new Date(set.releaseDate), 'MMM yyyy')}
                        </span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ PLATFORM FEATURES ═══ */}
      <section className="container py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger">
          {[
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              ),
              title: 'Live Market Data',
              description:
                'TCGPlayer pricing updated daily across every variant and condition. Track market movements, identify undervalued cards, and time your buys.',
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
              ),
              title: 'Portfolio Intelligence',
              description:
                'Understand your collection at a glance. Value breakdowns by set, rarity, and grade. Watch your portfolio grow with historical tracking.',
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              ),
              title: 'Grading Optimizer',
              description:
                'PSA, BGS, and CGC profit analysis on every card. Know exactly which raw cards are worth submitting and the expected return on grading.',
            },
          ].map((feature) => (
            <div key={feature.title} className="metric-card">
              <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--brand)] mb-4">
                {feature.icon}
              </div>
              <h3 className="text-display-sm mb-2">{feature.title}</h3>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="section-brand">
        <div className="container py-20 md:py-24">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-display-lg mb-4">Start building your vault</h2>
            <p className="text-[14px] text-[var(--text-secondary)] mb-8 max-w-md mx-auto leading-relaxed">
              Track every card. Monitor market prices. Optimize your grading submissions. Free forever, no credit card required.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/auth/signup" className="btn-primary px-6 py-3 text-[14px]">
                Create free account
              </Link>
              <Link href="/trending" className="btn-secondary px-6 py-3 text-[14px]">
                Explore the market
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

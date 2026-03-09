import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { SearchBar } from '@/components/layout/search-bar'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

// Cardmarket prices are in EUR — convert to USD for display
const EUR_TO_USD = 1.08

function toUsd(price: number | null, source: string): number | null {
  if (price == null) return null
  return source === 'cardmarket' ? price * EUR_TO_USD : price
}

export default async function HomePage() {
  const [
    recentSets,
    topCards,
    recentlyPriced,
    biggestCards,
    totalCards,
    totalSets,
  ] = await Promise.all([
    prisma.set.findMany({
      where: { language: 'en' },
      orderBy: { releaseDate: 'desc' },
      take: 8,
    }),
    prisma.cardPrice.findMany({
      where: { market: { not: null, gt: 2 } },
      orderBy: { market: 'desc' },
      take: 30,
      include: {
        card: {
          include: { set: { select: { name: true, id: true } } },
        },
      },
    }),
    prisma.cardPrice.findMany({
      where: { market: { not: null, gt: 0.5 } },
      orderBy: { updatedAt: 'desc' },
      take: 12,
      include: {
        card: {
          include: { set: { select: { name: true, id: true } } },
        },
      },
    }),
    prisma.cardPrice.findMany({
      where: { market: { not: null, gt: 20 } },
      orderBy: { market: 'desc' },
      take: 5,
      include: {
        card: {
          include: {
            set: { select: { name: true, id: true } },
            gradedPrices: {
              orderBy: { price: 'desc' },
              take: 3,
            },
          },
        },
      },
    }),
    prisma.card.count(),
    prisma.set.count({ where: { language: 'en' } }),
  ])

  // Deduplicate
  const seenCardIds = new Set<string>()
  const uniqueTopCards = topCards.filter(item => {
    if (seenCardIds.has(item.cardId)) return false
    if (!item.card.imageSmall) return false
    seenCardIds.add(item.cardId)
    return true
  }).slice(0, 12)

  const seenRecent = new Set<string>()
  const uniqueRecentlyPriced = recentlyPriced.filter(item => {
    if (seenRecent.has(item.cardId)) return false
    if (!item.card.imageSmall) return false
    seenRecent.add(item.cardId)
    return true
  }).slice(0, 6)

  // Featured card — the most valuable
  const featuredCard = biggestCards.find(c => c.card.imageSmall) || uniqueTopCards[0]
  // Runner-up showcase cards (next 3 most valuable, excluding featured)
  const showcaseCards = uniqueTopCards
    .filter(c => c.cardId !== featuredCard?.cardId)
    .slice(0, 3)

  return (
    <div className="animate-in">

      {/* ═══ HERO ═══ */}
      <section className="section-hero relative overflow-hidden">
        {/* Ambient floating card silhouettes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-96 rounded-3xl rotate-12 opacity-[0.03] border border-[var(--border-subtle)]"
            style={{ background: 'linear-gradient(135deg, var(--brand) 0%, transparent 60%)' }} />
          <div className="absolute -bottom-32 -left-16 w-64 h-80 rounded-3xl -rotate-6 opacity-[0.02] border border-[var(--border-subtle)]"
            style={{ background: 'linear-gradient(135deg, var(--gold) 0%, transparent 60%)' }} />
        </div>

        <div className="container relative pt-12 pb-10 md:pt-16 md:pb-14">
          <div className="max-w-3xl">
            <p className="text-eyebrow mb-3">Pokemon TCG Intelligence</p>
            <h1 className="text-display-xl mb-3">
              Every card.<br />
              <span className="gold-text">Every price.</span>
            </h1>
            <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed max-w-lg mb-6">
              Track market values across {totalCards.toLocaleString()} cards and {totalSets} sets.
              Real-time pricing, collection tracking, and grading intelligence.
            </p>

            <div className="max-w-xl mb-5">
              <SearchBar size="lg" />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-[var(--text-tertiary)]">Popular:</span>
              {['Charizard', 'Pikachu', 'Mewtwo', 'Lugia', 'Umbreon', 'Mew', 'Rayquaza', 'Gengar'].map((name) => (
                <Link key={name} href={`/sets?q=${name}`}
                  className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--brand)] px-2.5 py-1 rounded-md bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border-brand)] transition-all">
                  {name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURED SHOWCASE ═══ */}
      {featuredCard && featuredCard.card.imageSmall && (
        <section className="section-warm">
          <div className="container py-10 md:py-14">
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <p className="text-eyebrow gold-text mb-1">Most Valuable</p>
                <h2 className="text-display-md">Market Spotlight</h2>
              </div>
              <Link href="/trending" className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors">
                View all &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-start">
              {/* Featured card — large showcase */}
              <Link href={`/cards/${featuredCard.cardId}`} className="group block">
                <div className="card-frame-featured p-3 md:p-4">
                  <div className="relative aspect-[245/342] rounded-lg overflow-hidden">
                    <Image
                      src={featuredCard.card.imageLarge || featuredCard.card.imageSmall}
                      alt={featuredCard.card.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      sizes="340px"
                      priority
                    />
                  </div>
                  <div className="mt-3 px-1">
                    <p className="text-[15px] font-semibold group-hover:text-[var(--gold)] transition-colors">
                      {featuredCard.card.name}
                    </p>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                      {featuredCard.card.set.name} &middot; {featuredCard.card.rarity || 'Rare'}
                    </p>
                    <div className="flex items-baseline gap-4 mt-3">
                      <span className="price-tag-lg">
                        ${toUsd(featuredCard.market, featuredCard.source)?.toFixed(2)}
                      </span>
                      {featuredCard.low && (
                        <span className="text-[12px] text-[var(--text-tertiary)]">
                          Low ${toUsd(featuredCard.low, featuredCard.source)?.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>

              {/* Right column — runner-up cards + recently updated */}
              <div className="space-y-6">
                {/* Runner-up showcase */}
                {showcaseCards.length > 0 && (
                  <div>
                    <p className="text-label mb-3">Top Cards</p>
                    <div className="grid grid-cols-3 gap-3">
                      {showcaseCards.map((item, i) => {
                        const usdPrice = toUsd(item.market, item.source)
                        return (
                          <Link key={`sc-${item.cardId}-${i}`} href={`/cards/${item.cardId}`} className="group">
                            <div className="card-frame p-2">
                              <div className="relative aspect-[245/342] rounded-md overflow-hidden">
                                <Image
                                  src={item.card.imageSmall}
                                  alt={item.card.name}
                                  fill
                                  className="object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                                  sizes="(max-width: 1024px) 30vw, 180px"
                                  priority={i < 2}
                                />
                                {usdPrice != null && (
                                  <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold gold-text"
                                    style={{ background: 'oklch(0.085 0.006 275 / 85%)', backdropFilter: 'blur(6px)', border: '1px solid oklch(0.75 0.15 85 / 15%)' }}>
                                    ${usdPrice.toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="mt-1.5 px-0.5">
                              <p className="text-[12px] font-medium truncate group-hover:text-[var(--brand)] transition-colors">{item.card.name}</p>
                              <p className="text-[10px] text-[var(--text-tertiary)] truncate">{item.card.set.name}</p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Recently updated prices */}
                {uniqueRecentlyPriced.length > 0 && (
                  <div>
                    <p className="text-label mb-3">Recently Updated</p>
                    <div className="panel">
                      <div className="panel-body-flush divide-y divide-[var(--border-subtle)]">
                        {uniqueRecentlyPriced.map((item, i) => {
                          const usdPrice = toUsd(item.market, item.source)
                          return (
                            <Link key={`rp-${item.cardId}-${item.variant}-${i}`} href={`/cards/${item.cardId}`}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors">
                              <div className="w-7 h-10 rounded-sm bg-[var(--surface-2)] overflow-hidden shrink-0 relative">
                                {item.card.imageSmall && (
                                  <Image src={item.card.imageSmall} alt="" fill className="object-cover" sizes="28px" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-medium truncate">{item.card.name}</p>
                                <p className="text-[10px] text-[var(--text-tertiary)] truncate">{item.card.set.name}</p>
                              </div>
                              {usdPrice != null && (
                                <span className="price-tag text-[12px]">${usdPrice.toFixed(2)}</span>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="section-divider" />

      {/* ═══ MARKET MOVERS GALLERY ═══ */}
      {uniqueTopCards.length > 4 && (
        <section className="section-brand">
          <div className="container py-10 md:py-14">
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <p className="text-eyebrow mb-1">Highest Value</p>
                <h2 className="text-display-md">Market Movers</h2>
              </div>
              <Link href="/trending" className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors">
                Full market &rarr;
              </Link>
            </div>

            {/* Scrollable card row */}
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 snap-x snap-mandatory scrollbar-thin">
              {uniqueTopCards.slice(0, 12).map((item, i) => {
                const usdPrice = toUsd(item.market, item.source)
                return (
                  <Link key={`mm-${item.cardId}-${i}`} href={`/cards/${item.cardId}`}
                    className="group shrink-0 snap-start"
                    style={{ width: 'clamp(140px, 18vw, 180px)' }}>
                    <div className="card-frame p-1.5 h-full">
                      <div className="relative aspect-[245/342] rounded-md overflow-hidden bg-[var(--surface-2)]">
                        <Image
                          src={item.card.imageSmall}
                          alt={item.card.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.06]"
                          sizes="180px"
                          loading="lazy"
                        />
                        {usdPrice != null && (
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-semibold gold-text"
                            style={{ background: 'oklch(0.085 0.006 275 / 85%)', backdropFilter: 'blur(4px)' }}>
                            ${usdPrice.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-1.5 px-0.5">
                      <p className="text-[11px] font-medium truncate group-hover:text-[var(--brand)] transition-colors">{item.card.name}</p>
                      <p className="text-[9px] text-[var(--text-tertiary)] truncate">{item.card.set.name}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      <div className="section-divider" />

      {/* ═══ LATEST SETS ═══ */}
      {recentSets.length > 0 && (
        <section>
          <div className="container py-10 md:py-14">
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <p className="text-eyebrow mb-1">New Releases</p>
                <h2 className="text-display-md">Latest Sets</h2>
              </div>
              <Link href="/sets" className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors">
                All sets &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {recentSets.map((set, i) => (
                <Link key={set.id} href={`/sets/${set.id}`}
                  className="group surface-interactive rounded-xl p-4 hover:border-[var(--border-default)] transition-all"
                  style={{ animationDelay: `${i * 50}ms` }}>
                  {set.logoUrl ? (
                    <div className="relative h-8 w-full mb-3">
                      <Image src={set.logoUrl} alt={set.name} fill className="object-contain object-left" sizes="200px" />
                    </div>
                  ) : (
                    <p className="text-[13px] font-semibold mb-3 truncate">{set.name}</p>
                  )}
                  <p className="text-[12px] font-medium truncate group-hover:text-[var(--brand)] transition-colors">{set.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-[var(--text-tertiary)]">{set.printedTotal} cards</span>
                    {set.releaseDate && (
                      <>
                        <span className="text-[var(--text-tertiary)]">&middot;</span>
                        <span className="text-[10px] text-[var(--text-tertiary)]">{format(new Date(set.releaseDate), 'MMM yyyy')}</span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="section-divider" />

      {/* ═══ TOOLS & EXPLORE ═══ */}
      <section className="section-elevated">
        <div className="container py-10 md:py-14">
          <div className="text-center mb-8">
            <p className="text-eyebrow mb-1">Explore</p>
            <h2 className="text-display-md">Intelligence Tools</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            <Link href="/trending" className="group surface-interactive rounded-xl p-5 text-center hover:border-[var(--border-brand)] transition-all">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-muted)] border border-[var(--border-brand)] flex items-center justify-center mx-auto mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--brand)]">
                  <path d="M3 20L8 15L13 18L21 4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17 4H21V8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-[14px] font-semibold mb-1.5 group-hover:text-[var(--brand)] transition-colors">Market Tracker</h3>
              <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
                Track price movements and discover what&apos;s rising and falling.
              </p>
            </Link>

            <Link href="/assistant" className="group surface-interactive rounded-xl p-5 text-center hover:border-[var(--border-gold)] transition-all">
              <div className="w-12 h-12 rounded-xl bg-[var(--gold-muted)] border border-[var(--border-gold)] flex items-center justify-center mx-auto mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--gold)]">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-[14px] font-semibold mb-1.5 group-hover:text-[var(--gold)] transition-colors">Grading Advisor</h3>
              <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
                Find out if your cards are worth grading with PSA, BGS, or CGC.
              </p>
            </Link>

            <Link href="/assistant" className="group surface-interactive rounded-xl p-5 text-center hover:border-[var(--border-brand)] transition-all">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-muted)] border border-[var(--border-brand)] flex items-center justify-center mx-auto mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--brand)]">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-[14px] font-semibold mb-1.5 group-hover:text-[var(--brand)] transition-colors">AI Assistant</h3>
              <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
                Ask about any card, get price checks and collection insights.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section>
        <div className="container py-10 md:py-14">
          <div className="surface-gold rounded-2xl px-8 py-8 md:px-12 md:py-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-1">
              <h3 className="text-display-sm gold-text mb-2">Start tracking your collection</h3>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed max-w-md">
                Add cards, monitor your portfolio value over time, and get personalized grading recommendations.
              </p>
            </div>
            <Link href="/auth/signup"
              className="btn-primary text-[14px] font-semibold px-8 py-3 shrink-0">
              Sign up free &rarr;
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

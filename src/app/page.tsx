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
    biggestCards,
  ] = await Promise.all([
    // Latest sets (English only on homepage)
    prisma.set.findMany({
      where: { language: 'en' },
      orderBy: { releaseDate: 'desc' },
      take: 6,
    }),
    // Top market value cards
    prisma.cardPrice.findMany({
      where: { source: 'tcgplayer', market: { not: null, gt: 5 } },
      orderBy: { market: 'desc' },
      take: 8,
      include: {
        card: {
          include: { set: { select: { name: true, id: true } } },
        },
      },
    }),
    // Recently updated prices
    prisma.cardPrice.findMany({
      where: { source: 'tcgplayer', market: { not: null, gt: 1 } },
      orderBy: { updatedAt: 'desc' },
      take: 6,
      include: {
        card: {
          include: { set: { select: { name: true, id: true } } },
        },
      },
    }),
    // Highest value single cards for featured story
    prisma.cardPrice.findMany({
      where: { source: 'tcgplayer', market: { not: null, gt: 50 } },
      orderBy: { market: 'desc' },
      take: 1,
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
  ])

  const featuredCard = biggestCards[0] || topCards[0]

  return (
    <div>
      {/* ═══ 1. SEARCH-FIRST HERO ═══ */}
      <section className="border-b border-[var(--border-subtle)]">
        <div className="container py-6">
          <p className="text-[12px] text-[var(--text-tertiary)] mb-2 font-medium">
            Pokemon TCG prices, sets, and market intelligence
          </p>
          <div className="max-w-2xl">
            <SearchBar size="lg" />
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-[11px] text-[var(--text-tertiary)]">Trending:</span>
            {['Charizard', 'Pikachu', 'Mewtwo', 'Lugia', 'Umbreon', 'Mew', 'Rayquaza', 'Gengar'].map((name) => (
              <Link key={name} href={`/sets?q=${name}`}
                className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-0.5 rounded bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                {name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container py-6 space-y-10">

        {/* ═══ 2. MARKET MOVERS ═══ */}
        {topCards.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-[15px] font-semibold">Market Movers</h2>
                <span className="text-[10px] text-[var(--text-tertiary)] font-medium uppercase tracking-wide">Top Value</span>
              </div>
              <Link href="/trending" className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors">
                Full market &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
              {/* Card grid — most valuable */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {topCards.slice(0, 8).map((item, i) => (
                  <Link key={`top-${item.cardId}-${item.variant}-${i}`} href={`/cards/${item.cardId}`} className="group">
                    <div className="card-frame p-1.5">
                      <div className="relative aspect-[245/342] rounded-md overflow-hidden bg-[var(--surface-2)]">
                        <Image
                          src={item.card.imageSmall}
                          alt={item.card.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 180px"
                          priority={i < 4}
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

              {/* Recently updated sidebar */}
              {recentlyPriced.length > 0 && (
                <div className="panel h-fit">
                  <div className="panel-header">
                    <span className="text-[12px] font-semibold">Recently Updated</span>
                  </div>
                  <div className="panel-body-flush">
                    {recentlyPriced.map((item, i) => (
                      <Link key={`rp-${item.cardId}-${item.variant}-${i}`} href={`/cards/${item.cardId}`}
                        className={`flex items-center gap-2.5 px-3 py-2.5 hover:bg-[var(--surface-hover)] transition-colors ${i < recentlyPriced.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''}`}>
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
            </div>
          </section>
        )}

        {/* ═══ 3. LATEST RELEASES ═══ */}
        {recentSets.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-[15px] font-semibold">Latest Releases</h2>
              <Link href="/sets" className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors">
                All sets &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {recentSets.map((set) => (
                <Link key={set.id} href={`/sets/${set.id}`}
                  className="group surface-interactive rounded-lg p-3 hover:border-[var(--border-default)] transition-all">
                  {set.logoUrl ? (
                    <div className="relative h-7 w-full mb-2">
                      <Image src={set.logoUrl} alt={set.name} fill className="object-contain object-left" sizes="140px" />
                    </div>
                  ) : (
                    <p className="text-[11px] font-semibold mb-2 truncate">{set.name}</p>
                  )}
                  <p className="text-[11px] font-medium truncate group-hover:text-[var(--brand)] transition-colors">{set.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-[var(--text-tertiary)]">{set.printedTotal} cards</span>
                    {set.releaseDate && (
                      <span className="text-[10px] text-[var(--text-tertiary)]">{format(new Date(set.releaseDate), 'MMM yyyy')}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══ 4. FEATURED MARKET STORY ═══ */}
        {featuredCard && (
          <section>
            <Link href={`/cards/${featuredCard.cardId}`} className="group block">
              <div className="panel overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-0">
                  {/* Card image */}
                  <div className="relative w-full sm:w-48 aspect-[245/342] sm:aspect-auto bg-[var(--surface-2)]">
                    <Image
                      src={featuredCard.card.imageLarge || featuredCard.card.imageSmall}
                      alt={featuredCard.card.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, 200px"
                    />
                  </div>

                  {/* Story content */}
                  <div className="p-5 sm:p-6 flex flex-col justify-center">
                    <p className="text-eyebrow mb-2">Most Valuable Card</p>
                    <h3 className="text-[20px] font-display font-semibold tracking-tight mb-1 group-hover:text-[var(--brand)] transition-colors">
                      {featuredCard.card.name}
                    </h3>
                    <p className="text-[12px] text-[var(--text-secondary)] mb-4">
                      {featuredCard.card.set.name} &middot; {featuredCard.card.rarity || 'Rare'}
                    </p>

                    <div className="flex items-end gap-6">
                      <div>
                        <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide font-medium mb-1">Market Price</p>
                        <p className="text-[24px] font-semibold text-value gold-text leading-none">
                          ${featuredCard.market!.toFixed(2)}
                        </p>
                      </div>
                      {featuredCard.low && (
                        <div>
                          <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide font-medium mb-1">Low</p>
                          <p className="text-[15px] font-medium text-value text-[var(--text-secondary)] leading-none">
                            ${featuredCard.low.toFixed(2)}
                          </p>
                        </div>
                      )}
                      {featuredCard.high && (
                        <div>
                          <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide font-medium mb-1">High</p>
                          <p className="text-[15px] font-medium text-value text-[var(--text-secondary)] leading-none">
                            ${featuredCard.high.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>

                    {'gradedPrices' in featuredCard.card && featuredCard.card.gradedPrices.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                        <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide font-medium mb-2">Graded Values</p>
                        <div className="flex gap-4">
                          {featuredCard.card.gradedPrices.map((gp: { gradingCompany: string; grade: string; price: number | null }, idx: number) => (
                            gp.price && (
                              <div key={idx}>
                                <span className="text-[10px] text-[var(--text-tertiary)]">{gp.gradingCompany} {gp.grade}</span>
                                <p className="text-[13px] font-semibold text-value">${gp.price.toFixed(2)}</p>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* ═══ 5. TOOL PREVIEWS ═══ */}
        <section>
          <h2 className="text-[15px] font-semibold mb-4">Intelligence Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Price Tracker */}
            <Link href="/trending" className="group panel hover:border-[var(--border-default)] transition-all">
              <div className="panel-body">
                <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--brand)]">
                    <path d="M3 20L8 15L13 18L21 4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17 4H21V8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-[13px] font-semibold mb-1 group-hover:text-[var(--brand)] transition-colors">Market Tracker</h3>
                <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                  Track price movements across thousands of cards. See what&apos;s rising, falling, and most traded.
                </p>
              </div>
            </Link>

            {/* Grading Advisor */}
            <Link href="/assistant" className="group panel hover:border-[var(--border-default)] transition-all">
              <div className="panel-body">
                <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--brand)]">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-[13px] font-semibold mb-1 group-hover:text-[var(--brand)] transition-colors">Grading Advisor</h3>
                <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                  Find out if your cards are worth grading. Compare PSA, BGS, and CGC costs against potential profit.
                </p>
              </div>
            </Link>

            {/* Collection Analytics */}
            <Link href="/assistant" className="group panel hover:border-[var(--border-default)] transition-all">
              <div className="panel-body">
                <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--brand)]">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </div>
                <h3 className="text-[13px] font-semibold mb-1 group-hover:text-[var(--brand)] transition-colors">AI Assistant</h3>
                <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                  Ask about any card, get price checks, collection analysis, and personalized market insights.
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* ═══ 6. PERSONAL HOOK ═══ */}
        <section>
          <div className="rounded-xl border border-[var(--border-brand)] bg-[var(--brand-subtle)] px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold mb-1">Track your collection</h3>
              <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                Add cards, monitor portfolio value, and get grading recommendations — all in one place.
              </p>
            </div>
            <Link href="/auth/signup"
              className="btn-primary text-[13px] font-semibold px-6 py-2.5 shrink-0">
              Sign up free &rarr;
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}

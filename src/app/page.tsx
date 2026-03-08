import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { SearchBar } from '@/components/layout/search-bar'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [recentSets, topCards] = await Promise.all([
    prisma.set.findMany({
      orderBy: { releaseDate: 'desc' },
      take: 8,
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
  ])

  return (
    <div>
      {/* Hero — search-forward design */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-[var(--holo-purple)] opacity-[0.04] blur-[150px]" />
        </div>
        <div
          className="absolute inset-0 -z-10 opacity-[0.02]"
          style={{
            backgroundImage: 'radial-gradient(oklch(1 0 0 / 15%) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              The smartest way to
              <br />
              <span className="text-gradient">track Pokemon cards</span>
            </h1>
            <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
              Real-time prices, collection analytics, and AI-powered grading intelligence for every card ever printed.
            </p>

            {/* Search bar */}
            <div className="mt-8">
              <SearchBar />
            </div>

            {/* Quick links */}
            <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
              <span className="text-[11px] text-muted-foreground/40">Popular:</span>
              {['Charizard', 'Pikachu', 'Mewtwo', 'Lugia', 'Umbreon'].map((name) => (
                <Link
                  key={name}
                  href={`/sets?q=${name}`}
                  className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-full border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all"
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Top cards — visual showcase */}
      {topCards.length > 0 && (
        <section className="container pb-16">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top Market Value</h2>
            <Link href="/trending" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              View all
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {topCards.map((item, i) => (
              <Link key={`${item.cardId}-${item.variant}-${i}`} href={`/cards/${item.cardId}`} className="group">
                <div className="relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all">
                  <div className="relative aspect-[245/342] overflow-hidden">
                    <Image
                      src={item.card.imageSmall}
                      alt={item.card.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="200px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium truncate">{item.card.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground/50 truncate">{item.card.set.name}</span>
                      <span className="text-xs font-bold text-gradient-gold">${item.market!.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent sets — horizontal scroll */}
      {recentSets.length > 0 && (
        <section className="container pb-16">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">New Releases</h2>
            <Link href="/sets" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              All sets
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recentSets.map((set) => (
              <Link key={set.id} href={`/sets/${set.id}`} className="group">
                <div className="relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] p-4 transition-all holo-card h-full">
                  <div className="flex items-start gap-3">
                    {set.logoUrl && (
                      <div className="relative w-16 h-10 shrink-0">
                        <Image
                          src={set.logoUrl}
                          alt={set.name}
                          fill
                          className="object-contain object-left"
                          sizes="80px"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate group-hover:text-gradient transition-all">{set.name}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">{set.series}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground/40">{set.printedTotal} cards</span>
                        {set.releaseDate && (
                          <span className="text-[10px] text-muted-foreground/30">{format(new Date(set.releaseDate), 'MMM yyyy')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Value props — compact strip */}
      <section className="border-t border-white/[0.04]">
        <div className="container py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
                title: 'Live Prices',
                desc: 'TCGPlayer market data updated daily across every variant and condition.',
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 5-6" /></svg>,
                title: 'Portfolio Analytics',
                desc: 'Track your collection value over time with breakdowns by set, rarity, and grade.',
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" /></svg>,
                title: 'Grading Intelligence',
                desc: 'Know exactly which cards are worth grading with PSA, BGS, and CGC profit analysis.',
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted-foreground">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-16">
        <div className="relative rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--holo-purple)]/[0.04] to-[var(--holo-blue)]/[0.04]" />
          <div className="relative px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">
                Start tracking your cards
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Free forever. No credit card required.
              </p>
            </div>
            <Link href="/auth/signup">
              <button className="text-sm font-medium text-white px-6 py-2.5 rounded-full bg-gradient-to-r from-[var(--holo-purple)] to-[var(--holo-blue)] shadow-[0_0_24px_oklch(0.6_0.2_280_/_20%)] hover:shadow-[0_0_32px_oklch(0.6_0.2_280_/_30%)] transition-all whitespace-nowrap">
                Create Free Account
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

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
      {/* Hero */}
      <section className="container pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-display-xl">
            The collector&rsquo;s platform<br />for Pokemon TCG
          </h1>
          <p className="mt-4 text-[15px] text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            Real-time market prices. Collection analytics. Grading intelligence. Every card, every set.
          </p>
          <div className="mt-8 max-w-lg mx-auto">
            <SearchBar size="lg" />
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
            <span className="text-[11px] text-[var(--text-tertiary)]">Popular:</span>
            {['Charizard', 'Pikachu', 'Mewtwo', 'Lugia', 'Umbreon'].map((name) => (
              <Link
                key={name}
                href={`/sets?q=${name}`}
                className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-0.5 rounded surface-interactive transition-all"
              >
                {name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top Market Value */}
      {topCards.length > 0 && (
        <section className="container pb-12">
          <div className="flex items-center justify-between mb-4">
            <p className="text-label">Top Market Value</p>
            <Link href="/trending" className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 stagger">
            {topCards.map((item, i) => (
              <Link key={`${item.cardId}-${item.variant}-${i}`} href={`/cards/${item.cardId}`} className="group">
                <div className="surface-interactive rounded-lg overflow-hidden">
                  <div className="relative aspect-[245/342] bg-[var(--surface-2)]">
                    <Image
                      src={item.card.imageSmall}
                      alt={item.card.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      sizes="200px"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-[12px] font-medium truncate">{item.card.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-[var(--text-tertiary)] truncate">{item.card.set.name}</span>
                      <span className="text-[12px] font-semibold text-value gold-text">${item.market!.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New Releases */}
      {recentSets.length > 0 && (
        <section className="container pb-12">
          <div className="flex items-center justify-between mb-4">
            <p className="text-label">New Releases</p>
            <Link href="/sets" className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              All sets →
            </Link>
          </div>
          <div className="surface-1 rounded-lg divide-y divide-[var(--border-subtle)]">
            {recentSets.map((set) => (
              <Link key={set.id} href={`/sets/${set.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors">
                {set.logoUrl && (
                  <div className="relative w-20 h-8 shrink-0">
                    <Image src={set.logoUrl} alt={set.name} fill className="object-contain object-left" sizes="80px" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium truncate">{set.name}</p>
                  <p className="text-[11px] text-[var(--text-tertiary)]">{set.series}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[12px] text-[var(--text-secondary)]">{set.printedTotal} cards</p>
                  {set.releaseDate && (
                    <p className="text-[10px] text-[var(--text-tertiary)]">{format(new Date(set.releaseDate), 'MMM yyyy')}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Value Props */}
      <section className="border-y border-[var(--border-subtle)]">
        <div className="container py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Live Market Prices', desc: 'TCGPlayer data updated daily. Every variant, every condition, every card.' },
              { title: 'Portfolio Analytics', desc: 'Track your collection value with breakdowns by set, rarity, and grade.' },
              { title: 'Grading Intelligence', desc: 'PSA, BGS, and CGC profit analysis. Know exactly which cards to grade.' },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="text-[13px] font-semibold">{item.title}</h3>
                <p className="text-[12px] text-[var(--text-tertiary)] mt-1 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-14">
        <div className="surface-1 rounded-lg px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-display-md">Start tracking your cards</h2>
            <p className="text-[13px] text-[var(--text-secondary)] mt-1">Free forever. No credit card required.</p>
          </div>
          <Link href="/auth/signup" className="text-[13px] font-medium text-white px-5 py-2.5 rounded-md bg-[var(--brand)] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0">
            Create free account
          </Link>
        </div>
      </section>
    </div>
  )
}

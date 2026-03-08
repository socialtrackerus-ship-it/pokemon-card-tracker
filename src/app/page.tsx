import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SetGrid } from '@/components/sets/set-grid'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const recentSets = await prisma.set.findMany({
    orderBy: { releaseDate: 'desc' },
    take: 10,
  })

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Hero background effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[var(--holo-purple)] opacity-[0.06] blur-[100px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[var(--holo-blue)] opacity-[0.06] blur-[100px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[var(--holo-cyan)] opacity-[0.03] blur-[120px]" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(oklch(1 0 0 / 10%) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 10%) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="container py-24 md:py-36">
          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">Live market data from TCGPlayer</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9]">
              <span className="text-gradient">Track</span>
              <span className="text-foreground"> Your</span>
              <br />
              <span className="text-foreground">Pokemon </span>
              <span className="text-gradient">Cards</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Browse every set, track real-time prices, manage your collection, and get AI-powered grading intelligence.
            </p>

            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/sets">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[var(--holo-purple)] to-[var(--holo-blue)] hover:opacity-90 text-white border-0 shadow-[0_0_30px_oklch(0.6_0.2_280_/_25%)] hover:shadow-[0_0_40px_oklch(0.6_0.2_280_/_35%)] transition-all px-8 h-12"
                >
                  Browse Sets
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all px-8 h-12"
                >
                  Start Collecting
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features */}
      <section className="container py-16">
        <div className="grid md:grid-cols-3 gap-6 stagger-children">
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              ),
              title: 'Price Tracking',
              desc: 'Real-time market prices from TCGPlayer with daily updates and historical price charts.',
              gradient: 'from-[var(--holo-purple)] to-[var(--holo-blue)]',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              ),
              title: 'Collection Manager',
              desc: 'Track every card you own. See your collection\'s total value and detailed analytics.',
              gradient: 'from-[var(--holo-blue)] to-[var(--holo-cyan)]',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                </svg>
              ),
              title: 'Grading Intelligence',
              desc: 'Know which cards are worth grading. Compare PSA, BGS, and CGC values instantly.',
              gradient: 'from-[var(--holo-cyan)] to-[var(--holo-purple)]',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} opacity-80 mb-4`}>
                <span className="text-white">{feature.icon}</span>
              </div>
              <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Sets */}
      {recentSets.length > 0 && (
        <section className="container py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Latest Sets</h2>
              <p className="text-sm text-muted-foreground mt-1">Newest Pokemon TCG releases</p>
            </div>
            <Link href="/sets">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground gap-1">
                View All
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </div>
          <SetGrid sets={recentSets.map(s => ({
            id: s.id,
            name: s.name,
            series: s.series,
            printed_total: s.printedTotal,
            total: s.total,
            release_date: s.releaseDate || '',
            symbol_url: s.symbolUrl,
            logo_url: s.logoUrl,
            language: s.language,
            synced_at: s.syncedAt.toISOString(),
          }))} />
        </section>
      )}

      {/* CTA */}
      <section className="container py-16">
        <div className="relative rounded-3xl border border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--holo-purple)]/5 to-[var(--holo-blue)]/5" />
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'radial-gradient(oklch(1 0 0 / 20%) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />
          <div className="relative px-8 py-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Ready to <span className="text-gradient">level up</span> your collection?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join collectors who use PokeVault to track prices, manage their portfolio, and make smarter decisions.
            </p>
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[var(--holo-purple)] to-[var(--holo-blue)] hover:opacity-90 text-white border-0 shadow-[0_0_30px_oklch(0.6_0.2_280_/_20%)] px-10 h-12"
              >
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

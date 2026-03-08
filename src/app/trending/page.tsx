import { prisma } from '@/lib/db'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

function formatRelativeTime(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatPrice(value: number): string {
  return value >= 1000
    ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${value.toFixed(2)}`
}

export default async function TrendingPage() {
  const [
    expensiveCards,
    recentCards,
    totalTracked,
    avgPrice,
    recentCount,
    mostTrackedSet,
    cheapestCard,
  ] = await Promise.all([
    prisma.cardPrice.findMany({
      where: { market: { not: null } },
      orderBy: { market: 'desc' },
      take: 20,
      include: { card: { include: { set: { select: { name: true } } } } },
    }),
    prisma.cardPrice.findMany({
      where: { market: { not: null } },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: { card: { include: { set: { select: { name: true } } } } },
    }),
    prisma.cardPrice.count({
      where: { market: { not: null } },
    }),
    prisma.cardPrice.aggregate({
      where: { market: { not: null } },
      _avg: { market: true },
    }),
    prisma.cardPrice.count({
      where: { updatedAt: { gte: new Date(Date.now() - 86400000) } },
    }),
    prisma.cardPrice.groupBy({
      by: ['cardId'],
      where: { market: { not: null } },
      _count: { cardId: true },
    }).then(async (groups) => {
      const cardIds = groups.map((g) => g.cardId)
      const cards = await prisma.card.findMany({
        where: { id: { in: cardIds } },
        include: { set: { select: { name: true } } },
      })
      const setCounts: Record<string, number> = {}
      for (const card of cards) {
        const setName = card.set.name
        setCounts[setName] = (setCounts[setName] || 0) + 1
      }
      const top = Object.entries(setCounts).sort((a, b) => b[1] - a[1])[0]
      return top ? { name: top[0], count: top[1] } : null
    }),
    prisma.cardPrice.findFirst({
      where: { market: { not: null, gt: 0 } },
      orderBy: { market: 'asc' },
      include: { card: true },
    }),
  ])

  const mostValuable = expensiveCards[0] || null
  const highestPrice = mostValuable?.market ?? 0
  const lowestPrice = cheapestCard?.market ?? 0
  const average = avgPrice._avg.market ?? 0

  return (
    <div>
      {/* ── Hero Header ── */}
      <section className="section-hero">
        <div className="container">
          <p className="text-eyebrow">MARKET INTELLIGENCE</p>
          <h1 className="text-display-xl font-display mt-2">Card Market</h1>
          <p className="text-[14px] text-[var(--text-secondary)] mt-2 max-w-xl">
            Real-time pricing data across the Pok&eacute;mon TCG universe
          </p>
        </div>
      </section>

      {/* ── Market Overview Metrics ── */}
      <section className="section-elevated">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Most Valuable Card */}
            <div className="metric-card-gold">
              <p className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
                Most Valuable Card
              </p>
              {mostValuable ? (
                <>
                  <p className="text-metric gold-text">{formatPrice(mostValuable.market!)}</p>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-1 truncate">
                    {mostValuable.card.name}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-metric gold-text">--</p>
                  <p className="text-[12px] text-[var(--text-tertiary)] mt-1">No data</p>
                </>
              )}
            </div>

            {/* Total Cards Tracked */}
            <div className="metric-card">
              <p className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
                Cards Tracked
              </p>
              <p className="text-metric">{totalTracked.toLocaleString()}</p>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-1">With market prices</p>
            </div>

            {/* Average Market Price */}
            <div className="metric-card">
              <p className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
                Average Price
              </p>
              <p className="text-metric">{formatPrice(average)}</p>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-1">Across all variants</p>
            </div>

            {/* Recently Updated */}
            <div className="metric-card">
              <p className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
                Recently Updated
              </p>
              <p className="text-metric">{recentCount.toLocaleString()}</p>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-1">In the last 24 hours</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content: Two-Column Layout ── */}
      <section className="section-elevated" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="grid lg:grid-cols-[1fr_0.67fr] gap-6">
            {/* LEFT: Most Valuable Cards */}
            <div className="panel animate-in">
              <div className="panel-header">
                <div className="module-header">
                  <h2 className="text-[14px] font-semibold">Most Valuable Cards</h2>
                  <span className="text-[11px] text-[var(--text-tertiary)]">Top 20 by market price</span>
                </div>
              </div>
              <div className="panel-body-flush">
                <div className="overflow-y-auto max-h-[720px]">
                  <table className="w-full table-premium table-striped">
                    <thead>
                      <tr>
                        <th className="w-8 px-3 py-2.5 text-center text-[10px]">#</th>
                        <th className="w-10 px-2 py-2.5"></th>
                        <th className="text-left px-3 py-2.5 text-[10px]">Card</th>
                        <th className="text-left px-3 py-2.5 text-[10px] hidden md:table-cell">Variant</th>
                        <th className="text-right px-3 py-2.5 text-[10px]">Market</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expensiveCards.map((item, i) => (
                        <tr
                          key={`exp-${item.cardId}-${item.variant}-${i}`}
                          style={i < 3 ? { backgroundColor: 'oklch(0.82 0.11 75 / 3%)' } : undefined}
                        >
                          <td className="px-3 py-2 text-center">
                            <span
                              className={`text-[12px] font-semibold ${
                                i < 3 ? 'gold-text' : 'text-[var(--text-tertiary)]'
                              }`}
                            >
                              {i + 1}
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <Image
                              src={item.card.imageSmall}
                              alt={item.card.name}
                              width={32}
                              height={45}
                              className="rounded-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Link
                              href={`/cards/${item.cardId}`}
                              className="text-[13px] font-medium hover:text-[var(--brand)] transition-colors"
                            >
                              {item.card.name}
                            </Link>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {item.card.rarity && (
                                <span className="text-[10px] text-[var(--text-tertiary)]">
                                  {item.card.rarity}
                                </span>
                              )}
                              <span className="text-[10px] text-[var(--text-tertiary)]">
                                &middot;
                              </span>
                              <span className="text-[10px] text-[var(--text-tertiary)]">
                                {item.card.set.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 hidden md:table-cell">
                            <span className="chip text-[10px] capitalize">{item.variant}</span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className="text-value text-[13px] font-semibold gold-text">
                              {formatPrice(item.market!)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT: Recently Updated */}
            <div className="panel animate-in" style={{ animationDelay: '60ms' }}>
              <div className="panel-header">
                <div className="module-header">
                  <h2 className="text-[14px] font-semibold">Recently Updated</h2>
                  <span className="text-[11px] text-[var(--text-tertiary)]">Latest price changes</span>
                </div>
              </div>
              <div className="panel-body-flush">
                <div className="overflow-y-auto max-h-[720px]">
                  <table className="w-full table-premium table-striped">
                    <thead>
                      <tr>
                        <th className="w-10 px-2 py-2.5"></th>
                        <th className="text-left px-3 py-2.5 text-[10px]">Card</th>
                        <th className="text-right px-3 py-2.5 text-[10px]">Market</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCards.map((item, i) => (
                        <tr key={`rec-${item.cardId}-${item.variant}-${i}`}>
                          <td className="px-2 py-2">
                            <Image
                              src={item.card.imageSmall}
                              alt={item.card.name}
                              width={28}
                              height={39}
                              className="rounded-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Link
                              href={`/cards/${item.cardId}`}
                              className="text-[13px] font-medium hover:text-[var(--brand)] transition-colors"
                            >
                              {item.card.name}
                            </Link>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-[var(--text-tertiary)] capitalize">
                                {item.variant}
                              </span>
                              <span className="text-[10px] text-[var(--text-tertiary)]">
                                &middot;
                              </span>
                              <span className="text-[10px] text-[var(--text-tertiary)]">
                                {formatRelativeTime(item.updatedAt)}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className="text-value text-[13px] font-semibold gold-text">
                              {formatPrice(item.market!)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Market Insights Strip ── */}
      <section className="section-elevated" style={{ paddingTop: 0, paddingBottom: '3rem' }}>
        <div className="container">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Highest Rarity Premium */}
            <div className="surface-premium rounded-lg p-5 animate-in" style={{ animationDelay: '120ms' }}>
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
                Highest Rarity Premium
              </p>
              {mostValuable ? (
                <>
                  <p className="text-[18px] font-semibold gold-text font-display">
                    {formatPrice(mostValuable.market!)}
                  </p>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-1.5">
                    {mostValuable.card.name}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                    {mostValuable.card.rarity ?? 'Unknown rarity'} &middot; {mostValuable.card.set.name}
                  </p>
                </>
              ) : (
                <p className="text-[13px] text-[var(--text-tertiary)]">No data available</p>
              )}
            </div>

            {/* Most Tracked Set */}
            <div className="surface-premium rounded-lg p-5 animate-in" style={{ animationDelay: '180ms' }}>
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
                Most Tracked Set
              </p>
              {mostTrackedSet ? (
                <>
                  <p className="text-[18px] font-semibold font-display">
                    {mostTrackedSet.name}
                  </p>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-1.5">
                    {mostTrackedSet.count.toLocaleString()} cards with prices
                  </p>
                </>
              ) : (
                <p className="text-[13px] text-[var(--text-tertiary)]">No data available</p>
              )}
            </div>

            {/* Price Range */}
            <div className="surface-premium rounded-lg p-5 animate-in" style={{ animationDelay: '240ms' }}>
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
                Price Range
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-[18px] font-semibold gold-text font-display">
                  {formatPrice(lowestPrice)}
                </span>
                <span className="text-[11px] text-[var(--text-tertiary)]">&mdash;</span>
                <span className="text-[18px] font-semibold gold-text font-display">
                  {formatPrice(highestPrice)}
                </span>
              </div>
              <p className="text-[12px] text-[var(--text-secondary)] mt-1.5">
                Lowest to highest tracked market price
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

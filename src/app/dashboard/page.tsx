'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface CollectionItem {
  id: string
  card_id: string
  quantity: number
  condition: string
  variant: string
  is_graded: boolean
  grading_company: string | null
  grade: string | null
  purchase_price: number | null
  cards: {
    id: string
    name: string
    image_small: string
    rarity: string | null
    number: string
    sets: { id: string; name: string }
    card_prices: { variant: string; market: number | null }[]
  }
}

export default function DashboardPage() {
  const [collection, setCollection] = useState<CollectionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/collection')
      if (res.ok) setCollection(await res.json())
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="container py-10 space-y-8">
        <div className="space-y-2">
          <div className="h-4 w-32 skeleton rounded" />
          <div className="h-9 w-48 skeleton rounded" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 skeleton rounded-lg" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="h-80 skeleton rounded-lg" />)}
        </div>
        <div className="h-64 skeleton rounded-lg" />
      </div>
    )
  }

  // Compute stats
  const totalCards = collection.reduce((s, i) => s + i.quantity, 0)
  let totalValue = 0
  const bySet: Record<string, { count: number; value: number }> = {}
  const byRarity: Record<string, { count: number; value: number }> = {}

  interface TopHolding {
    item: CollectionItem
    market: number
    total: number
  }
  const holdings: TopHolding[] = []

  for (const item of collection) {
    const price = item.cards.card_prices?.find(p => p.variant === item.variant)
    const market = price?.market ? Number(price.market) : 0
    const val = market * item.quantity
    totalValue += val

    if (market > 0) {
      holdings.push({ item, market, total: val })
    }

    const setName = item.cards.sets?.name || 'Unknown'
    if (!bySet[setName]) bySet[setName] = { count: 0, value: 0 }
    bySet[setName].count += item.quantity
    bySet[setName].value += val

    const rarity = item.cards.rarity || 'Unknown'
    if (!byRarity[rarity]) byRarity[rarity] = { count: 0, value: 0 }
    byRarity[rarity].count += item.quantity
    byRarity[rarity].value += val
  }

  const topSets = Object.entries(bySet).sort((a, b) => b[1].value - a[1].value).slice(0, 10)
  const topRarities = Object.entries(byRarity).sort((a, b) => b[1].value - a[1].value)
  const topHoldings = holdings.sort((a, b) => b.total - a.total).slice(0, 5)
  const maxSetValue = topSets[0]?.[1].value || 1
  const maxRarityValue = topRarities[0]?.[1].value || 1
  const avgPerCard = collection.length > 0 ? totalValue / collection.length : 0

  const hasData = collection.length > 0

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="mb-8 animate-in">
        <p className="text-eyebrow mb-1">COMMAND CENTER</p>
        <h1 className="text-display-xl font-display">Dashboard</h1>
      </div>

      {/* Portfolio Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 stagger">
        <div className="metric-card">
          <p className="text-label">Total Cards</p>
          <p className="text-metric-sm mt-1">{totalCards}</p>
        </div>
        <div className="metric-card">
          <p className="text-label">Unique Cards</p>
          <p className="text-metric-sm mt-1">{collection.length}</p>
        </div>
        <div className="metric-card-gold">
          <p className="text-label">Portfolio Value</p>
          <p className="text-metric gold-text mt-1">${totalValue.toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <p className="text-label">Avg Per Card</p>
          <p className="text-metric-sm mt-1">${avgPerCard.toFixed(2)}</p>
        </div>
      </div>

      {!hasData ? (
        /* Empty State */
        <div className="empty-state animate-in">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <h3 className="text-display-sm font-display mt-4">No portfolio data yet</h3>
          <p className="text-[13px] text-[var(--text-secondary)] mt-2 max-w-xs mx-auto">
            Add cards to your collection to see value breakdowns, top holdings, and portfolio analytics.
          </p>
          <Link href="/sets" className="btn-primary inline-flex items-center gap-2 mt-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            Browse Sets
          </Link>
        </div>
      ) : (
        <>
          {/* Two-Column Breakdown */}
          <div className="grid md:grid-cols-2 gap-6 mb-8 stagger">
            {/* Value by Set */}
            <div className="panel animate-in">
              <div className="panel-header">
                <div className="module-header">
                  <h2 className="text-[13px] font-semibold">Value by Set</h2>
                  <span className="text-[11px] text-[var(--text-tertiary)]">Top {topSets.length}</span>
                </div>
              </div>
              <div className="panel-body">
                {topSets.length === 0 ? (
                  <p className="text-[12px] text-[var(--text-tertiary)] py-8 text-center">No set data available</p>
                ) : (
                  <div className="space-y-3.5">
                    {topSets.map(([name, data]) => (
                      <div key={name}>
                        <div className="flex justify-between items-baseline mb-1.5">
                          <span className="text-[12px] font-medium truncate mr-3">{name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[12px] text-value font-medium">${data.value.toFixed(2)}</span>
                            <span className="text-[10px] text-[var(--text-tertiary)]">{data.count} cards</span>
                          </div>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-bar-fill progress-bar-fill-brand"
                            style={{ width: `${(data.value / maxSetValue) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Value by Rarity */}
            <div className="panel animate-in">
              <div className="panel-header">
                <div className="module-header">
                  <h2 className="text-[13px] font-semibold">Value by Rarity</h2>
                  <span className="text-[11px] text-[var(--text-tertiary)]">{topRarities.length} types</span>
                </div>
              </div>
              <div className="panel-body">
                {topRarities.length === 0 ? (
                  <p className="text-[12px] text-[var(--text-tertiary)] py-8 text-center">No rarity data available</p>
                ) : (
                  <div className="space-y-3.5">
                    {topRarities.map(([name, data]) => (
                      <div key={name}>
                        <div className="flex justify-between items-baseline mb-1.5">
                          <span className="text-[12px] font-medium truncate mr-3">{name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[12px] text-value font-medium">${data.value.toFixed(2)}</span>
                            <span className="text-[10px] text-[var(--text-tertiary)]">{data.count} cards</span>
                          </div>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-bar-fill progress-bar-fill-gold"
                            style={{ width: `${(data.value / maxRarityValue) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Holdings */}
          <div className="panel animate-in">
            <div className="panel-header">
              <div className="module-header">
                <h2 className="text-[13px] font-semibold">Top Holdings</h2>
                <span className="text-[11px] text-[var(--text-tertiary)]">Most valuable cards</span>
              </div>
            </div>
            {topHoldings.length === 0 ? (
              <div className="panel-body">
                <p className="text-[12px] text-[var(--text-tertiary)] py-8 text-center">No priced cards in collection</p>
              </div>
            ) : (
              <div className="panel-body-flush overflow-x-auto">
                <table className="w-full table-premium">
                  <thead>
                    <tr>
                      <th className="w-12 px-3 py-2.5"></th>
                      <th className="text-left px-3 py-2.5">Card</th>
                      <th className="text-left px-3 py-2.5 hidden md:table-cell">Set</th>
                      <th className="text-right px-3 py-2.5">Market Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topHoldings.map(({ item, market, total }) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2.5">
                          <div className="w-8 h-11 relative rounded-sm overflow-hidden">
                            <Image
                              src={item.cards.image_small}
                              alt={item.cards.name}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <Link
                            href={`/cards/${item.cards.id}`}
                            className="text-[12px] font-medium hover:text-[var(--brand)] transition-colors"
                          >
                            {item.cards.name}
                          </Link>
                          {item.cards.rarity && (
                            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{item.cards.rarity}</p>
                          )}
                        </td>
                        <td className="px-3 py-2.5 hidden md:table-cell">
                          <span className="text-[11px] text-[var(--text-tertiary)]">{item.cards.sets.name}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="text-value font-semibold gold-text text-[12px]">
                            ${total.toFixed(2)}
                          </span>
                          {item.quantity > 1 && (
                            <p className="text-[10px] text-[var(--text-tertiary)]">${market.toFixed(2)} &times; {item.quantity}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="panel-footer">
              <Link href="/collection" className="text-[12px] text-[var(--brand)] hover:underline font-medium">
                View full collection &rarr;
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

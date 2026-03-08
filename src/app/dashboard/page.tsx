'use client'

import { useEffect, useState } from 'react'

interface CollectionItem {
  quantity: number
  variant: string
  cards: {
    name: string
    rarity: string | null
    sets: { name: string }
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
      <div className="container py-8 space-y-6">
        <div className="h-8 w-48 skeleton" />
        <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-20 skeleton" />)}</div>
        <div className="grid grid-cols-2 gap-6">{[1,2].map(i => <div key={i} className="h-64 skeleton" />)}</div>
      </div>
    )
  }

  const totalCards = collection.reduce((s, i) => s + i.quantity, 0)
  let totalValue = 0
  const bySet: Record<string, { count: number; value: number }> = {}
  const byRarity: Record<string, { count: number; value: number }> = {}

  for (const item of collection) {
    const card = item.cards as any
    const price = card?.card_prices?.find((p: any) => p.variant === item.variant)
    const market = price?.market ? Number(price.market) : 0
    const val = market * item.quantity
    totalValue += val
    const sn = card?.sets?.name || 'Unknown'
    if (!bySet[sn]) bySet[sn] = { count: 0, value: 0 }
    bySet[sn].count += item.quantity
    bySet[sn].value += val
    const r = card?.rarity || 'Unknown'
    if (!byRarity[r]) byRarity[r] = { count: 0, value: 0 }
    byRarity[r].count += item.quantity
    byRarity[r].value += val
  }

  const topSets = Object.entries(bySet).sort((a, b) => b[1].value - a[1].value).slice(0, 10)
  const topRarities = Object.entries(byRarity).sort((a, b) => b[1].value - a[1].value)
  const maxSV = topSets[0]?.[1].value || 1
  const maxRV = topRarities[0]?.[1].value || 1

  const stats = [
    { label: 'Total Cards', value: totalCards.toString() },
    { label: 'Unique', value: collection.length.toString() },
    { label: 'Total Value', value: `$${totalValue.toFixed(2)}`, gold: true },
  ]

  return (
    <div className="container py-8">
      <h1 className="text-display-lg mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-3 mb-8 stagger">
        {stats.map((s) => (
          <div key={s.label} className="surface-1 rounded-lg p-4">
            <p className="text-label">{s.label}</p>
            <p className={`text-xl font-semibold text-value mt-1 ${s.gold ? 'gold-text' : ''}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <BreakdownPanel title="Value by Set" items={topSets} max={maxSV} color="brand" />
        <BreakdownPanel title="Value by Rarity" items={topRarities} max={maxRV} color="gold" />
      </div>
    </div>
  )
}

function BreakdownPanel({ title, items, max, color }: { title: string; items: [string, { count: number; value: number }][]; max: number; color: 'brand' | 'gold' }) {
  const barColor = color === 'brand' ? 'bg-[var(--brand)]' : 'bg-[var(--gold)]'
  return (
    <div className="surface-1 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
        <p className="text-[13px] font-semibold">{title}</p>
      </div>
      <div className="p-4">
        {items.length === 0 ? (
          <p className="text-[12px] text-[var(--text-tertiary)] py-6 text-center">No data yet</p>
        ) : (
          <div className="space-y-3">
            {items.map(([name, data]) => (
              <div key={name}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[12px] font-medium truncate mr-2">{name}</span>
                  <span className="text-[12px] text-value font-medium shrink-0">${data.value.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-[var(--surface-3)]">
                    <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${(data.value / max) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">{data.count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

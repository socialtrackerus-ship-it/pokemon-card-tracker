'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

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
      if (res.ok) {
        setCollection(await res.json())
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="container py-10 space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  // Compute analytics
  const totalCards = collection.reduce((sum, item) => sum + item.quantity, 0)

  let totalValue = 0
  const bySet: Record<string, { count: number; value: number }> = {}
  const byRarity: Record<string, { count: number; value: number }> = {}

  for (const item of collection) {
    const card = item.cards as any
    const price = card?.card_prices?.find((p: any) => p.variant === item.variant)
    const market = price?.market ? Number(price.market) : 0
    const itemValue = market * item.quantity

    totalValue += itemValue

    const setName = card?.sets?.name || 'Unknown'
    if (!bySet[setName]) bySet[setName] = { count: 0, value: 0 }
    bySet[setName].count += item.quantity
    bySet[setName].value += itemValue

    const rarity = card?.rarity || 'Unknown'
    if (!byRarity[rarity]) byRarity[rarity] = { count: 0, value: 0 }
    byRarity[rarity].count += item.quantity
    byRarity[rarity].value += itemValue
  }

  const topSets = Object.entries(bySet)
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 10)

  const topRarities = Object.entries(byRarity)
    .sort((a, b) => b[1].value - a[1].value)

  const maxSetValue = topSets.length > 0 ? topSets[0][1].value : 1
  const maxRarityValue = topRarities.length > 0 ? topRarities[0][1].value : 1

  const stats = [
    {
      label: 'Total Cards',
      value: totalCards.toString(),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
      gradient: 'from-[var(--holo-purple)] to-[var(--holo-blue)]',
    },
    {
      label: 'Unique Cards',
      value: collection.length.toString(),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
        </svg>
      ),
      gradient: 'from-[var(--holo-blue)] to-[var(--holo-cyan)]',
    },
    {
      label: 'Total Value',
      value: `$${totalValue.toFixed(2)}`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      gradient: 'from-[var(--holo-gold)] to-[oklch(0.7_0.16_60)]',
    },
  ]

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">
        <span className="text-gradient">Dashboard</span>
      </h1>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 stagger-children">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-5 overflow-hidden hover:border-white/10 transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center opacity-70`}>
                <span className="text-white">{stat.icon}</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* By Set */}
        <Card className="border-white/5 bg-white/[0.02] rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--holo-purple)] to-[var(--holo-blue)] flex items-center justify-center opacity-70">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>
              <CardTitle className="text-base">Value by Set</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {topSets.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No data yet</p>
            ) : (
              <div className="space-y-4">
                {topSets.map(([name, data]) => (
                  <div key={name}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-[10px] text-muted-foreground/50">{data.count} cards</p>
                      </div>
                      <p className="font-semibold text-sm">${data.value.toFixed(2)}</p>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--holo-purple)] to-[var(--holo-blue)] transition-all duration-500"
                        style={{ width: `${(data.value / maxSetValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Rarity */}
        <Card className="border-white/5 bg-white/[0.02] rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--holo-gold)] to-[oklch(0.7_0.16_60)] flex items-center justify-center opacity-70">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                </svg>
              </div>
              <CardTitle className="text-base">Value by Rarity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {topRarities.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No data yet</p>
            ) : (
              <div className="space-y-4">
                {topRarities.map(([rarity, data]) => (
                  <div key={rarity}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div>
                        <p className="text-sm font-medium">{rarity}</p>
                        <p className="text-[10px] text-muted-foreground/50">{data.count} cards</p>
                      </div>
                      <p className="font-semibold text-sm">${data.value.toFixed(2)}</p>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--holo-gold)] to-[oklch(0.7_0.16_60)] transition-all duration-500"
                        style={{ width: `${(data.value / maxRarityValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

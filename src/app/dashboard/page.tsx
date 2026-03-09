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

function getRarityColor(rarity: string | null): string {
  if (!rarity) return 'var(--rarity-common)'
  const r = rarity.toLowerCase()
  if (r.includes('secret') || r.includes('hyper')) return 'var(--rarity-secret)'
  if (r.includes('ultra') || r.includes('illustration') || r.includes('alt')) return 'var(--rarity-ultra)'
  if (r.includes('holo') && r.includes('rare')) return 'var(--rarity-holo)'
  if (r.includes('rare')) return 'var(--rarity-rare)'
  if (r.includes('uncommon')) return 'var(--rarity-uncommon)'
  return 'var(--rarity-common)'
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
        {/* Skeleton Hero */}
        <div className="flex flex-col items-center py-12">
          <div className="h-3 w-24 skeleton rounded mb-4" />
          <div className="h-14 w-64 skeleton rounded-lg mb-3" />
          <div className="h-4 w-48 skeleton rounded" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-28 skeleton rounded-xl" />)}
        </div>
        <div className="h-64 skeleton rounded-xl" />
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="h-72 skeleton rounded-xl" />)}
        </div>
      </div>
    )
  }

  // Compute stats
  const totalCards = collection.reduce((s, i) => s + i.quantity, 0)
  let totalValue = 0
  const bySet: Record<string, { count: number; value: number; setId?: string }> = {}
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
    const setId = item.cards.sets?.id
    if (!bySet[setName]) bySet[setName] = { count: 0, value: 0, setId }
    bySet[setName].count += item.quantity
    bySet[setName].value += val

    const rarity = item.cards.rarity || 'Unknown'
    if (!byRarity[rarity]) byRarity[rarity] = { count: 0, value: 0 }
    byRarity[rarity].count += item.quantity
    byRarity[rarity].value += val
  }

  const topSets = Object.entries(bySet).sort((a, b) => b[1].value - a[1].value).slice(0, 8)
  const topRarities = Object.entries(byRarity).sort((a, b) => b[1].value - a[1].value)
  const topHoldings = holdings.sort((a, b) => b.total - a.total).slice(0, 8)
  const maxSetValue = topSets[0]?.[1].value || 1
  const uniqueSets = new Set(collection.map(i => i.cards.sets?.id)).size

  const hasData = collection.length > 0

  return (
    <div className="animate-in">
      {/* ═══════ HERO — Portfolio Spotlight ═══════ */}
      <div className="section-hero relative overflow-hidden">
        <div className="container py-14 lg:py-20 relative z-10">
          <div className="flex flex-col items-center text-center animate-in">
            <p className="text-eyebrow mb-3 tracking-[0.15em]">YOUR VAULT</p>

            {/* Big Portfolio Value */}
            <div className="relative">
              <h1
                className="font-display text-[clamp(3rem,8vw,5.5rem)] leading-[1] tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, var(--gold-bright), var(--gold), var(--gold-dim))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 40px oklch(0.82 0.11 75 / 15%))',
                }}
              >
                ${totalValue.toFixed(2)}
              </h1>
              {/* Ambient glow behind value */}
              <div
                className="absolute inset-0 -z-10 blur-3xl opacity-20"
                style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)' }}
              />
            </div>

            <p className="text-[var(--text-secondary)] text-sm mt-3">
              Portfolio Value
            </p>

            {/* Quick Stats Row */}
            <div className="flex items-center gap-6 mt-6">
              <div className="text-center">
                <p className="text-metric-sm">{totalCards}</p>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">Cards</p>
              </div>
              <div className="w-px h-8 bg-[var(--border-subtle)]" />
              <div className="text-center">
                <p className="text-metric-sm">{collection.length}</p>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">Unique</p>
              </div>
              <div className="w-px h-8 bg-[var(--border-subtle)]" />
              <div className="text-center">
                <p className="text-metric-sm">{uniqueSets}</p>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">Sets</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, var(--brand) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)' }} />
      </div>

      <div className="container pb-12">
        {!hasData ? (
          /* ═══════ Empty State ═══════ */
          <div className="flex flex-col items-center text-center py-16 animate-in">
            <div className="w-20 h-20 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-[var(--text-tertiary)]">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <h3 className="text-display-md font-display">Your vault is empty</h3>
            <p className="text-[13px] text-[var(--text-secondary)] mt-2 max-w-sm">
              Start adding cards to track your portfolio value, discover trends, and manage your collection like a pro.
            </p>
            <div className="flex gap-3 mt-8">
              <Link href="/sets" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                Browse Sets
              </Link>
              <Link href="/trending" className="btn-secondary inline-flex items-center gap-2 px-5 py-2.5">
                Trending Cards
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* ═══════ Top Holdings — Visual Card Strip ═══════ */}
            {topHoldings.length > 0 && (
              <section className="mt-10 animate-in">
                <div className="flex items-baseline justify-between mb-5">
                  <div>
                    <h2 className="text-display-sm font-display">Crown Jewels</h2>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Your most valuable holdings</p>
                  </div>
                  <Link href="/collection" className="text-[11px] text-[var(--brand)] hover:underline font-medium">
                    View all &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 stagger">
                  {topHoldings.slice(0, 4).map(({ item, market, total }) => (
                    <Link
                      key={item.id}
                      href={`/cards/${item.cards.id}`}
                      className="group"
                    >
                      <div className="card-frame hover-lift">
                        <div className="relative aspect-[245/342] overflow-hidden rounded-t-[inherit]">
                          {item.cards.image_small ? (
                            <div className="zoom-container w-full h-full">
                              <Image
                                src={item.cards.image_small}
                                alt={item.cards.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 50vw, 25vw"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[var(--surface-2)]">
                              <p className="text-[11px] text-[var(--text-tertiary)] px-3 text-center">{item.cards.name}</p>
                            </div>
                          )}
                          {/* Value badge overlay */}
                          <div
                            className="absolute bottom-2 right-2 gold-text text-[11px] font-semibold px-2 py-0.5 rounded-md"
                            style={{
                              background: 'oklch(0.13 0.005 250 / 85%)',
                              backdropFilter: 'blur(8px)',
                              border: '1px solid oklch(0.75 0.15 85 / 20%)',
                            }}
                          >
                            ${total.toFixed(2)}
                          </div>
                        </div>
                        <div className="px-2.5 py-2">
                          <p className="text-[12px] font-medium truncate text-[var(--text-primary)]">{item.cards.name}</p>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-[10px] text-[var(--text-tertiary)] truncate">{item.cards.sets.name}</span>
                            {item.quantity > 1 && (
                              <span className="text-[9px] text-[var(--text-tertiary)]">&times;{item.quantity}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Runners Up — Compact Row */}
                {topHoldings.length > 4 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 stagger">
                    {topHoldings.slice(4, 8).map(({ item, total }) => (
                      <Link
                        key={item.id}
                        href={`/cards/${item.cards.id}`}
                        className="surface-interactive flex items-center gap-3 px-3 py-2.5 rounded-lg"
                      >
                        <div className="w-7 h-10 relative rounded-sm overflow-hidden shrink-0">
                          {item.cards.image_small ? (
                            <Image src={item.cards.image_small} alt={item.cards.name} fill className="object-cover" sizes="28px" />
                          ) : (
                            <div className="w-full h-full bg-[var(--surface-3)]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium truncate">{item.cards.name}</p>
                          <p className="text-[10px] gold-text font-medium">${total.toFixed(2)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ═══════ Analytics Grid ═══════ */}
            <div className="grid md:grid-cols-2 gap-6 mt-10 stagger">
              {/* Value by Set */}
              <section className="panel animate-in">
                <div className="panel-header">
                  <div className="flex items-center justify-between w-full">
                    <h2 className="text-[13px] font-semibold">Portfolio by Set</h2>
                    <span className="text-[10px] text-[var(--text-tertiary)]">{topSets.length} sets</span>
                  </div>
                </div>
                <div className="panel-body">
                  {topSets.length === 0 ? (
                    <p className="text-[12px] text-[var(--text-tertiary)] py-8 text-center">No data yet</p>
                  ) : (
                    <div className="space-y-4">
                      {topSets.map(([name, data], idx) => {
                        const pct = (data.value / maxSetValue) * 100
                        return (
                          <div key={name} className="group">
                            <div className="flex justify-between items-baseline mb-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="text-[10px] font-bold w-5 text-center shrink-0"
                                  style={{ color: idx < 3 ? 'var(--gold)' : 'var(--text-tertiary)' }}
                                >
                                  {idx + 1}
                                </span>
                                {data.setId ? (
                                  <Link href={`/sets/${data.setId}`} className="text-[12px] font-medium truncate hover:text-[var(--brand)] transition-colors">
                                    {name}
                                  </Link>
                                ) : (
                                  <span className="text-[12px] font-medium truncate">{name}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2.5 shrink-0 ml-2">
                                <span className="text-[12px] text-value font-semibold">${data.value.toFixed(2)}</span>
                                <span className="chip text-[9px] px-1.5 py-0.5">{data.count}</span>
                              </div>
                            </div>
                            <div className="progress-bar ml-7">
                              <div
                                className="progress-bar-fill"
                                style={{
                                  width: `${pct}%`,
                                  background: idx < 3
                                    ? 'linear-gradient(90deg, var(--gold-dim), var(--gold))'
                                    : 'var(--brand)',
                                  transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </section>

              {/* Rarity Breakdown — Visual */}
              <section className="panel animate-in">
                <div className="panel-header">
                  <div className="flex items-center justify-between w-full">
                    <h2 className="text-[13px] font-semibold">Rarity Breakdown</h2>
                    <span className="text-[10px] text-[var(--text-tertiary)]">{topRarities.length} types</span>
                  </div>
                </div>
                <div className="panel-body">
                  {topRarities.length === 0 ? (
                    <p className="text-[12px] text-[var(--text-tertiary)] py-8 text-center">No data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {topRarities.map(([name, data]) => {
                        const color = getRarityColor(name)
                        const valuePct = (data.value / (topRarities[0]?.[1].value || 1)) * 100
                        return (
                          <div key={name} className="group">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ background: color }}
                                />
                                <span className="text-[12px] font-medium">{name}</span>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <span className="text-[12px] text-value font-semibold">${data.value.toFixed(2)}</span>
                                <span className="text-[10px] text-[var(--text-tertiary)]">{data.count}</span>
                              </div>
                            </div>
                            <div className="progress-bar">
                              <div
                                className="progress-bar-fill"
                                style={{
                                  width: `${valuePct}%`,
                                  background: color,
                                  opacity: 0.7,
                                  transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* ═══════ Quick Actions ═══════ */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-10 stagger">
              <Link href="/sets" className="surface-interactive rounded-xl px-5 py-5 group">
                <div className="w-9 h-9 rounded-lg bg-[var(--brand-muted)] flex items-center justify-center mb-3 group-hover:bg-[var(--brand-subtle)] transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </div>
                <p className="text-[13px] font-semibold">Browse Sets</p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Explore every expansion</p>
              </Link>

              <Link href="/collection" className="surface-interactive rounded-xl px-5 py-5 group">
                <div className="w-9 h-9 rounded-lg bg-[var(--gold-muted)] flex items-center justify-center mb-3 group-hover:bg-[var(--gold-subtle)] transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <p className="text-[13px] font-semibold">My Collection</p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Manage your cards</p>
              </Link>

              <Link href="/trending" className="surface-interactive rounded-xl px-5 py-5 group">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors" style={{ background: 'oklch(0.72 0.15 155 / 10%)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gain)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                </div>
                <p className="text-[13px] font-semibold">Trending</p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Market movers today</p>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

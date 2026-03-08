'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

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

type ViewMode = 'table' | 'gallery'

export default function CollectionPage() {
  const [collection, setCollection] = useState<CollectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [totalValue, setTotalValue] = useState(0)
  const [cardCount, setCardCount] = useState(0)
  const [view, setView] = useState<ViewMode>('table')

  useEffect(() => {
    async function load() {
      const [collRes, valRes] = await Promise.all([
        fetch('/api/collection'),
        fetch('/api/collection/value'),
      ])
      if (collRes.ok) setCollection(await collRes.json())
      if (valRes.ok) {
        const data = await valRes.json()
        setTotalValue(data.totalValue)
        setCardCount(data.cardCount)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function removeItem(itemId: string) {
    const res = await fetch(`/api/collection/${itemId}`, { method: 'DELETE' })
    if (res.ok) {
      setCollection(prev => prev.filter(item => item.id !== itemId))
      toast.success('Card removed from collection')
    } else {
      toast.error('Failed to remove card')
    }
  }

  function getMarketPrice(item: CollectionItem) {
    const price = item.cards.card_prices?.find(p => p.variant === item.variant)
    return price?.market ? Number(price.market) : null
  }

  const avgValue = collection.length > 0 ? totalValue / collection.length : 0

  const sortedCollection = [...collection].sort((a, b) => {
    const aPrice = getMarketPrice(a)
    const bPrice = getMarketPrice(b)
    const aTotal = aPrice ? aPrice * a.quantity : 0
    const bTotal = bPrice ? bPrice * b.quantity : 0
    return bTotal - aTotal
  })

  if (loading) {
    return (
      <div className="container py-10 space-y-8">
        <div className="space-y-2">
          <div className="h-4 w-28 skeleton rounded" />
          <div className="h-9 w-48 skeleton rounded" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 skeleton rounded-lg" />
          ))}
        </div>
        <div className="h-8 w-48 skeleton rounded" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-72 skeleton rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="mb-8 animate-in">
        <p className="text-eyebrow mb-1">MY COLLECTION</p>
        <h1 className="text-display-xl font-display">Collection</h1>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 stagger">
        <div className="metric-card">
          <p className="text-label">Total Cards</p>
          <p className="text-metric-sm mt-1">{cardCount}</p>
        </div>
        <div className="metric-card">
          <p className="text-label">Unique Cards</p>
          <p className="text-metric-sm mt-1">{collection.length}</p>
        </div>
        <div className="metric-card-gold">
          <p className="text-label">Est. Value</p>
          <p className="text-metric gold-text mt-1">${totalValue.toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <p className="text-label">Avg Card Value</p>
          <p className="text-metric-sm mt-1">${avgValue.toFixed(2)}</p>
        </div>
      </div>

      {collection.length === 0 ? (
        /* Empty State */
        <div className="empty-state animate-in">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          </div>
          <h3 className="text-display-sm font-display mt-4">Your vault is empty</h3>
          <p className="text-[13px] text-[var(--text-secondary)] mt-2 max-w-xs mx-auto">
            Start by browsing sets and adding cards to build your collection portfolio.
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
          {/* View Toggle */}
          <div className="flex items-center justify-between mb-5">
            <div className="tab-bar">
              <button
                onClick={() => setView('table')}
                className={view === 'table' ? 'tab-item-active' : 'tab-item'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M3 15h18" />
                  <path d="M9 3v18" />
                </svg>
                Table
              </button>
              <button
                onClick={() => setView('gallery')}
                className={view === 'gallery' ? 'tab-item-active' : 'tab-item'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="7" height="7" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="14" rx="1" />
                  <rect width="7" height="7" x="3" y="14" rx="1" />
                </svg>
                Gallery
              </button>
            </div>
          </div>

          {/* Table View */}
          {view === 'table' && (
            <div className="panel animate-in">
              <div className="panel-header flex items-center justify-between">
                <p className="text-[13px] font-medium">
                  {sortedCollection.length} {sortedCollection.length === 1 ? 'item' : 'items'}
                </p>
                <p className="text-[12px] text-[var(--text-tertiary)]">Sorted by total value</p>
              </div>
              <div className="panel-body-flush overflow-x-auto">
                <table className="w-full table-premium">
                  <thead>
                    <tr>
                      <th className="w-12 px-3 py-2.5"></th>
                      <th className="text-left px-3 py-2.5">Card</th>
                      <th className="text-left px-3 py-2.5 hidden md:table-cell">Set</th>
                      <th className="text-left px-3 py-2.5 hidden sm:table-cell">Variant</th>
                      <th className="text-left px-3 py-2.5 hidden sm:table-cell">Condition</th>
                      <th className="text-right px-3 py-2.5">Qty</th>
                      <th className="text-right px-3 py-2.5">Market</th>
                      <th className="text-right px-3 py-2.5">Total</th>
                      <th className="w-20 px-3 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCollection.map((item) => {
                      const market = getMarketPrice(item)
                      const total = market ? market * item.quantity : null
                      return (
                        <tr key={item.id} className="group">
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
                              <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                                {item.cards.rarity} &middot; #{item.cards.number}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 hidden md:table-cell">
                            <Link
                              href={`/sets/${item.cards.sets.id}`}
                              className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                            >
                              {item.cards.sets.name}
                            </Link>
                          </td>
                          <td className="px-3 py-2.5 hidden sm:table-cell">
                            <span className="text-[11px] text-[var(--text-secondary)] capitalize">{item.variant}</span>
                          </td>
                          <td className="px-3 py-2.5 hidden sm:table-cell">
                            <span className="chip">{item.condition}</span>
                            {item.is_graded && (
                              <span className="gold-badge text-[10px] px-1.5 py-0.5 rounded ml-1.5 inline-flex items-center gap-0.5">
                                {item.grading_company} {item.grade}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className="text-[12px] text-value">{item.quantity}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className="text-[12px] text-value text-[var(--text-secondary)]">
                              {market ? `$${market.toFixed(2)}` : '\u2014'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className="text-value font-semibold gold-text text-[12px]">
                              {total ? `$${total.toFixed(2)}` : '\u2014'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--loss)] transition-colors opacity-0 group-hover:opacity-100"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="panel-footer flex items-center justify-between">
                <p className="text-[11px] text-[var(--text-tertiary)]">{cardCount} total cards across {collection.length} unique entries</p>
                <p className="text-[12px] font-semibold gold-text">${totalValue.toFixed(2)} portfolio value</p>
              </div>
            </div>
          )}

          {/* Gallery View */}
          {view === 'gallery' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in stagger">
              {sortedCollection.map((item) => {
                const market = getMarketPrice(item)
                return (
                  <div key={item.id} className="surface-interactive rounded-xl overflow-hidden hover-lift transition-all duration-200">
                    <div className="relative aspect-[5/7] bg-[var(--surface-2)]">
                      <Image
                        src={item.cards.image_small}
                        alt={item.cards.name}
                        fill
                        className="object-contain p-3"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      />
                    </div>
                    <div className="p-3 space-y-1.5">
                      <Link
                        href={`/cards/${item.cards.id}`}
                        className="text-[12px] font-semibold leading-tight hover:text-[var(--brand)] transition-colors line-clamp-1"
                      >
                        {item.cards.name}
                      </Link>
                      <div className="flex items-center justify-between">
                        <span className="price-tag gold-text">
                          {market ? `$${market.toFixed(2)}` : '\u2014'}
                        </span>
                        <span className="chip">{item.condition}</span>
                      </div>
                      {item.is_graded && (
                        <span className="gold-badge text-[10px] px-1.5 py-0.5 rounded inline-flex items-center">
                          {item.grading_company} {item.grade}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

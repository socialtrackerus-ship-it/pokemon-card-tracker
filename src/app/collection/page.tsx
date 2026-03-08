'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

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

export default function CollectionPage() {
  const [collection, setCollection] = useState<CollectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [totalValue, setTotalValue] = useState(0)
  const [cardCount, setCardCount] = useState(0)

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
    if (res.ok) setCollection(prev => prev.filter(item => item.id !== itemId))
  }

  function getMarketPrice(item: CollectionItem) {
    const price = item.cards.card_prices?.find(p => p.variant === item.variant)
    return price?.market ? Number(price.market) : null
  }

  if (loading) {
    return (
      <div className="container py-8 space-y-6">
        <div className="h-8 w-48 skeleton" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-20 skeleton" />)}
        </div>
        <div className="h-64 skeleton" />
      </div>
    )
  }

  const stats = [
    { label: 'Total Cards', value: cardCount.toString() },
    { label: 'Unique', value: collection.length.toString() },
    { label: 'Est. Value', value: `$${totalValue.toFixed(2)}`, gold: true },
  ]

  return (
    <div className="container py-8">
      <h1 className="text-display-lg mb-6">Collection</h1>

      <div className="grid grid-cols-3 gap-3 mb-8 stagger">
        {stats.map((s) => (
          <div key={s.label} className="surface-1 rounded-lg p-4">
            <p className="text-label">{s.label}</p>
            <p className={`text-xl font-semibold text-value mt-1 ${s.gold ? 'gold-text' : ''}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {collection.length === 0 ? (
        <div className="surface-1 rounded-lg py-16 text-center">
          <p className="text-[13px] text-[var(--text-secondary)] mb-4">Your collection is empty.</p>
          <Link href="/sets" className="text-[13px] font-medium text-white px-4 py-2 rounded-md bg-[var(--brand)] hover:opacity-90 transition-opacity">
            Browse sets to add cards
          </Link>
        </div>
      ) : (
        <div className="surface-1 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-premium">
              <thead>
                <tr>
                  <th className="w-10 px-3 py-2.5"></th>
                  <th className="text-left px-3 py-2.5">Card</th>
                  <th className="text-left px-3 py-2.5 hidden md:table-cell">Set</th>
                  <th className="text-left px-3 py-2.5 hidden sm:table-cell">Variant</th>
                  <th className="text-left px-3 py-2.5 hidden sm:table-cell">Condition</th>
                  <th className="text-right px-3 py-2.5">Qty</th>
                  <th className="text-right px-3 py-2.5">Market</th>
                  <th className="text-right px-3 py-2.5">Total</th>
                  <th className="w-16 px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {collection.map((item) => {
                  const market = getMarketPrice(item)
                  return (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <Image src={item.cards.image_small} alt={item.cards.name} width={28} height={39} className="rounded-sm" />
                      </td>
                      <td className="px-3 py-2">
                        <Link href={`/cards/${item.cards.id}`} className="text-[12px] font-medium hover:text-[var(--brand)] transition-colors">
                          {item.cards.name}
                        </Link>
                        {item.cards.rarity && <p className="text-[10px] text-[var(--text-tertiary)]">{item.cards.rarity}</p>}
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <Link href={`/sets/${item.cards.sets.id}`} className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
                          {item.cards.sets.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2 hidden sm:table-cell text-[11px] text-[var(--text-secondary)] capitalize">{item.variant}</td>
                      <td className="px-3 py-2 hidden sm:table-cell">
                        <span className="text-[10px] text-[var(--text-secondary)] px-1.5 py-0.5 rounded surface-2">{item.condition}</span>
                        {item.is_graded && <span className="text-[10px] gold-badge px-1.5 py-0.5 rounded ml-1">{item.grading_company} {item.grade}</span>}
                      </td>
                      <td className="px-3 py-2 text-right text-[12px] text-value">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-[12px] text-value text-[var(--text-secondary)]">
                        {market ? `$${market.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-[12px] text-value font-medium">
                        {market ? `$${(market * item.quantity).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <button onClick={() => removeItem(item.id)} className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--loss)] transition-colors">
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

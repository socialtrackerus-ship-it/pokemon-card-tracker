'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
      if (collRes.ok) {
        const data = await collRes.json()
        setCollection(data)
      }
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
    }
  }

  function getMarketPrice(item: CollectionItem) {
    const price = item.cards.card_prices?.find(p => p.variant === item.variant)
    return price?.market ? Number(price.market) : null
  }

  if (loading) {
    return (
      <div className="container py-10 space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  const stats = [
    {
      label: 'Total Cards',
      value: cardCount.toString(),
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
      label: 'Estimated Value',
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
        My <span className="text-gradient">Collection</span>
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 stagger-children">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-5 overflow-hidden group hover:border-white/10 transition-all"
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br opacity-[0.03] blur-2xl" />
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

      {collection.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-white/5 bg-white/[0.02]">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <p className="text-muted-foreground mb-4">Your collection is empty.</p>
          <Link href="/sets">
            <Button className="bg-gradient-to-r from-[var(--holo-purple)] to-[var(--holo-blue)] text-white border-0">
              Browse Sets to Add Cards
            </Button>
          </Link>
        </div>
      ) : (
        <Card className="border-white/5 bg-white/[0.02] rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-12 text-muted-foreground/50"></TableHead>
                  <TableHead className="text-muted-foreground/50">Card</TableHead>
                  <TableHead className="text-muted-foreground/50">Set</TableHead>
                  <TableHead className="text-muted-foreground/50">Variant</TableHead>
                  <TableHead className="text-muted-foreground/50">Condition</TableHead>
                  <TableHead className="text-right text-muted-foreground/50">Qty</TableHead>
                  <TableHead className="text-right text-muted-foreground/50">Market</TableHead>
                  <TableHead className="text-right text-muted-foreground/50">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collection.map((item) => {
                  const market = getMarketPrice(item)
                  return (
                    <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell>
                        <Image
                          src={item.cards.image_small}
                          alt={item.cards.name}
                          width={32}
                          height={45}
                          className="rounded-md"
                        />
                      </TableCell>
                      <TableCell>
                        <Link href={`/cards/${item.cards.id}`} className="font-medium text-sm hover:text-gradient transition-all">
                          {item.cards.name}
                        </Link>
                        {item.cards.rarity && (
                          <p className="text-[10px] text-muted-foreground/50">{item.cards.rarity}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/sets/${item.cards.sets.id}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                          {item.cards.sets.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize text-xs text-muted-foreground">{item.variant}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] border-white/10 bg-white/5">{item.condition}</Badge>
                        {item.is_graded && (
                          <Badge className="ml-1 text-[10px] bg-gradient-to-r from-[var(--holo-gold)] to-[oklch(0.7_0.16_60)] text-white border-0">
                            {item.grading_company} {item.grade}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {market ? `$${market.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {market ? `$${(market * item.quantity).toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-destructive text-xs"
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

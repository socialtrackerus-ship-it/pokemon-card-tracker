import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { PriceChart } from '@/components/cards/price-chart'
import { GradingSuggestion } from '@/components/cards/grading-suggestion'
import { AddToCollection } from '@/components/collection/add-to-collection'

export const dynamic = 'force-dynamic'

interface Attack { name: string; cost: string[]; convertedEnergyCost: number; damage: string; text: string }
interface Ability { name: string; text: string; type: string }

interface CardDetailPageProps {
  params: Promise<{ cardId: string }>
}

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  const { cardId } = await params
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { prices: true, set: true },
  })
  if (!card) notFound()

  const gradedPrices = await prisma.gradedPrice.findMany({ where: { cardId } })
  const prices = card.prices
  const attacks = (card.attacks || []) as unknown as Attack[]
  const abilities = (card.abilities || []) as unknown as Ability[]
  const types = (card.types || []) as unknown as string[]

  return (
    <div className="container py-8">
      <Link href={`/sets/${card.set.id}`} className="inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors mb-4">
        ← {card.set.name}
      </Link>

      <div className="grid md:grid-cols-[360px_1fr] gap-8 lg:gap-12">
        {/* Image */}
        <div>
          <div className="sticky top-16">
            <div className="surface-1 rounded-lg p-3">
              <Image
                src={card.imageLarge}
                alt={card.name}
                width={360}
                height={503}
                className="w-full h-auto rounded"
                priority
              />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] text-[var(--text-tertiary)]">#{card.number}</span>
            </div>
            <h1 className="text-display-lg">{card.name}</h1>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="brand-badge text-[11px] font-medium px-2 py-0.5 rounded">{card.supertype}</span>
              {card.rarity && <span className="gold-badge text-[11px] font-medium px-2 py-0.5 rounded">{card.rarity}</span>}
              {card.hp && <span className="text-[11px] font-medium px-2 py-0.5 rounded surface-2">HP {card.hp}</span>}
              {types.map((t: string) => (
                <span key={t} className="text-[11px] font-medium px-2 py-0.5 rounded surface-2">{t}</span>
              ))}
            </div>
            <div className="mt-4">
              <AddToCollection cardId={card.id} cardName={card.name} variants={prices.length > 0 ? prices.map(p => p.variant) : ['normal']} />
            </div>
          </div>

          {/* Market Prices */}
          {prices.length > 0 && (
            <div className="surface-1 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                <p className="text-[13px] font-semibold">Market Prices</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full table-premium">
                  <thead>
                    <tr>
                      <th className="text-left px-4 py-2.5">Variant</th>
                      <th className="text-right px-4 py-2.5">Low</th>
                      <th className="text-right px-4 py-2.5">Mid</th>
                      <th className="text-right px-4 py-2.5">High</th>
                      <th className="text-right px-4 py-2.5">Market</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prices.map((p) => (
                      <tr key={p.variant}>
                        <td className="px-4 py-2.5 font-medium capitalize text-[13px]">{p.variant}</td>
                        <td className="px-4 py-2.5 text-right text-value text-[var(--text-secondary)] text-[13px]">{p.low ? `$${p.low.toFixed(2)}` : '—'}</td>
                        <td className="px-4 py-2.5 text-right text-value text-[var(--text-secondary)] text-[13px]">{p.mid ? `$${p.mid.toFixed(2)}` : '—'}</td>
                        <td className="px-4 py-2.5 text-right text-value text-[var(--text-secondary)] text-[13px]">{p.high ? `$${p.high.toFixed(2)}` : '—'}</td>
                        <td className="px-4 py-2.5 text-right text-value font-semibold gold-text text-[13px]">{p.market ? `$${p.market.toFixed(2)}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {card.tcgplayerUrl && (
                <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
                  <a href={card.tcgplayerUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[var(--brand)] hover:underline">
                    View on TCGPlayer →
                  </a>
                </div>
              )}
            </div>
          )}

          <PriceChart cardId={card.id} variant={prices[0]?.variant || 'normal'} />

          <GradingSuggestion
            rawPrice={prices.find(p => p.variant === 'normal')?.market ?? null}
            gradedPrices={gradedPrices.map(gp => ({ grading_company: gp.gradingCompany, grade: gp.grade, price: gp.price }))}
          />

          {/* Abilities */}
          {abilities.length > 0 && (
            <div className="surface-1 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                <p className="text-[13px] font-semibold">Abilities</p>
              </div>
              <div className="divide-y divide-[var(--border-subtle)]">
                {abilities.map((a, i) => (
                  <div key={i} className="px-4 py-3">
                    <p className="text-[13px] font-medium">{a.name} <span className="text-label ml-1">{a.type}</span></p>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-1 leading-relaxed">{a.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attacks */}
          {attacks.length > 0 && (
            <div className="surface-1 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                <p className="text-[13px] font-semibold">Attacks</p>
              </div>
              <div className="divide-y divide-[var(--border-subtle)]">
                {attacks.map((atk, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-medium">{atk.name}</p>
                      {atk.damage && <span className="text-lg font-semibold text-value">{atk.damage}</span>}
                    </div>
                    {atk.cost && atk.cost.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {atk.cost.map((c, j) => (
                          <span key={j} className="text-[10px] px-1.5 py-0.5 rounded surface-2 text-[var(--text-tertiary)]">{c}</span>
                        ))}
                      </div>
                    )}
                    {atk.text && <p className="text-[12px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">{atk.text}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {card.artist && (
            <p className="text-[11px] text-[var(--text-tertiary)]">Illustrated by {card.artist}</p>
          )}
        </div>
      </div>
    </div>
  )
}

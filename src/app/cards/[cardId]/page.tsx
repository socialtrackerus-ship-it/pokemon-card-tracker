import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PriceChart } from '@/components/cards/price-chart'
import { GradingSuggestion } from '@/components/cards/grading-suggestion'
import { AddToCollection } from '@/components/collection/add-to-collection'

export const dynamic = 'force-dynamic'

interface Attack {
  name: string
  cost: string[]
  convertedEnergyCost: number
  damage: string
  text: string
}

interface Ability {
  name: string
  text: string
  type: string
}

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

  const gradedPrices = await prisma.gradedPrice.findMany({
    where: { cardId },
  })

  const prices = card.prices
  const attacks = (card.attacks || []) as unknown as Attack[]
  const abilities = (card.abilities || []) as unknown as Ability[]
  const types = (card.types || []) as unknown as string[]

  return (
    <div className="container py-10">
      <div className="grid md:grid-cols-[380px_1fr] gap-10">
        {/* Card Image */}
        <div>
          <div className="sticky top-24">
            <div className="relative group">
              {/* Glow behind card */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[var(--holo-purple)]/10 to-[var(--holo-blue)]/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative overflow-hidden rounded-2xl shadow-2xl shadow-black/40">
                <Image
                  src={card.imageLarge}
                  alt={card.name}
                  width={380}
                  height={531}
                  className="w-full h-auto"
                  priority
                />
                {/* Holographic overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--holo-purple)]/5 via-transparent to-[var(--holo-cyan)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Card Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href={`/sets/${card.set.id}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                {card.set.name}
              </Link>
              <span className="text-xs text-muted-foreground/40">#{card.number}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">{card.name}</h1>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge className="bg-gradient-to-r from-[var(--holo-purple)] to-[var(--holo-blue)] text-white border-0 text-xs">
                {card.supertype}
              </Badge>
              {card.rarity && (
                <Badge variant="secondary" className="bg-white/5 border-white/10 text-xs">
                  {card.rarity}
                </Badge>
              )}
              {card.hp && (
                <Badge variant="outline" className="border-white/10 text-xs">
                  HP {card.hp}
                </Badge>
              )}
              {types.map((type: string) => (
                <Badge key={type} variant="outline" className="border-white/10 text-xs">
                  {type}
                </Badge>
              ))}
            </div>
            <div className="mt-5">
              <AddToCollection
                cardId={card.id}
                cardName={card.name}
                variants={prices.length > 0 ? prices.map(p => p.variant) : ['normal']}
              />
            </div>
          </div>

          {/* Pricing */}
          {prices.length > 0 && (
            <Card className="border-white/5 bg-white/[0.02] rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Market Prices</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-muted-foreground/60">Variant</TableHead>
                      <TableHead className="text-right text-muted-foreground/60">Low</TableHead>
                      <TableHead className="text-right text-muted-foreground/60">Mid</TableHead>
                      <TableHead className="text-right text-muted-foreground/60">High</TableHead>
                      <TableHead className="text-right text-muted-foreground/60">Market</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prices.map((price) => (
                      <TableRow key={price.variant} className="border-white/5 hover:bg-white/[0.02]">
                        <TableCell className="font-medium capitalize">{price.variant}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{price.low ? `$${price.low.toFixed(2)}` : '-'}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{price.mid ? `$${price.mid.toFixed(2)}` : '-'}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{price.high ? `$${price.high.toFixed(2)}` : '-'}</TableCell>
                        <TableCell className="text-right font-semibold text-gradient">{price.market ? `$${price.market.toFixed(2)}` : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {card.tcgplayerUrl && (
                  <div className="mt-4">
                    <a href={card.tcgplayerUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="border-white/10 bg-white/5 hover:bg-white/10">
                        View on TCGPlayer
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1.5">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                        </svg>
                      </Button>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Price Chart */}
          <PriceChart cardId={card.id} variant={prices[0]?.variant || 'normal'} />

          {/* Grading */}
          <GradingSuggestion
            rawPrice={prices.find(p => p.variant === 'normal')?.market ?? null}
            gradedPrices={gradedPrices.map(gp => ({
              grading_company: gp.gradingCompany,
              grade: gp.grade,
              price: gp.price,
            }))}
          />

          {/* Abilities */}
          {abilities.length > 0 && (
            <Card className="border-white/5 bg-white/[0.02] rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Abilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {abilities.map((ability, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <p className="font-semibold text-sm">
                      {ability.name}
                      <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[var(--holo-purple)]/10 text-[var(--holo-purple)] font-medium">{ability.type}</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{ability.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Attacks */}
          {attacks.length > 0 && (
            <Card className="border-white/5 bg-white/[0.02] rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Attacks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {attacks.map((attack, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{attack.name}</p>
                      {attack.damage && (
                        <span className="font-bold text-lg text-gradient">{attack.damage}</span>
                      )}
                    </div>
                    {attack.cost && (
                      <div className="flex gap-1 mt-1">
                        {attack.cost.map((c, j) => (
                          <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                    {attack.text && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{attack.text}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Artist */}
          {card.artist && (
            <p className="text-xs text-muted-foreground/50">
              Illustrated by <span className="text-muted-foreground">{card.artist}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

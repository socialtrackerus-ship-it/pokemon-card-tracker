import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function TrendingPage() {
  const expensiveCards = await prisma.cardPrice.findMany({
    where: { market: { not: null } },
    orderBy: { market: 'desc' },
    take: 20,
    include: {
      card: {
        include: { set: { select: { name: true } } },
      },
    },
  })

  const recentCards = await prisma.cardPrice.findMany({
    where: { market: { not: null } },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    include: {
      card: {
        include: { set: { select: { name: true } } },
      },
    },
  })

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="text-gradient">Trending</span> Cards
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Most valuable cards and recent price updates
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Most Valuable */}
        <Card className="border-white/5 bg-white/[0.02] rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--holo-gold)] to-[oklch(0.7_0.16_60)] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                </svg>
              </div>
              <CardTitle className="text-base">Most Valuable</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-12 text-muted-foreground/50"></TableHead>
                  <TableHead className="text-muted-foreground/50">Card</TableHead>
                  <TableHead className="text-muted-foreground/50">Set</TableHead>
                  <TableHead className="text-muted-foreground/50">Variant</TableHead>
                  <TableHead className="text-right text-muted-foreground/50">Market</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expensiveCards.map((item, i) => (
                  <TableRow key={`${item.cardId}-${item.variant}-${i}`} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <div className="relative overflow-hidden rounded-md">
                        <Image
                          src={item.card.imageSmall}
                          alt={item.card.name}
                          width={32}
                          height={45}
                          className="rounded-md"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/cards/${item.cardId}`} className="font-medium text-sm hover:text-gradient transition-all">
                        {item.card.name}
                      </Link>
                      {item.card.rarity && (
                        <p className="text-[10px] text-muted-foreground/50">{item.card.rarity}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.card.set.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize text-[10px] bg-white/5 border-white/10">{item.variant}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm text-gradient-gold">
                      ${item.market!.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recently Updated */}
        <Card className="border-white/5 bg-white/[0.02] rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--holo-blue)] to-[var(--holo-cyan)] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
              </div>
              <CardTitle className="text-base">Recently Updated</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-12 text-muted-foreground/50"></TableHead>
                  <TableHead className="text-muted-foreground/50">Card</TableHead>
                  <TableHead className="text-muted-foreground/50">Set</TableHead>
                  <TableHead className="text-muted-foreground/50">Variant</TableHead>
                  <TableHead className="text-right text-muted-foreground/50">Market</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCards.map((item, i) => (
                  <TableRow key={`${item.cardId}-${item.variant}-${i}`} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <div className="relative overflow-hidden rounded-md">
                        <Image
                          src={item.card.imageSmall}
                          alt={item.card.name}
                          width={32}
                          height={45}
                          className="rounded-md"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/cards/${item.cardId}`} className="font-medium text-sm hover:text-gradient transition-all">
                        {item.card.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.card.set.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize text-[10px] bg-white/5 border-white/10">{item.variant}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm">
                      ${item.market!.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

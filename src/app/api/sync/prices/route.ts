import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const BASE_URL = 'https://api.pokemontcg.io/v2'
  const headers: Record<string, string> = {}
  if (process.env.POKEMON_TCG_API_KEY) {
    headers['X-Api-Key'] = process.env.POKEMON_TCG_API_KEY
  }

  const sets = await prisma.set.findMany({
    orderBy: { releaseDate: 'desc' },
    take: 20,
    select: { id: true },
  })

  let totalUpdated = 0

  for (const set of sets) {
    try {
      const res = await fetch(
        `${BASE_URL}/cards?q=set.id:${set.id}&pageSize=250`,
        { headers }
      )
      if (!res.ok) continue
      const data = await res.json()

      for (const card of data.data) {
        const prices = card.tcgplayer?.prices
        if (!prices) continue

        for (const [variant, p] of Object.entries(prices) as [string, any][]) {
          await prisma.cardPrice.upsert({
            where: { cardId_variant: { cardId: card.id, variant } },
            create: {
              cardId: card.id,
              variant,
              low: p.low ?? null,
              mid: p.mid ?? null,
              high: p.high ?? null,
              market: p.market ?? null,
            },
            update: {
              low: p.low ?? null,
              mid: p.mid ?? null,
              high: p.high ?? null,
              market: p.market ?? null,
              updatedAt: new Date(),
            },
          })

          if (p.market) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            await prisma.priceHistory.upsert({
              where: {
                cardId_variant_recordedDate: { cardId: card.id, variant, recordedDate: today },
              },
              create: {
                cardId: card.id,
                variant,
                marketPrice: p.market,
                recordedDate: today,
              },
              update: { marketPrice: p.market },
            })
          }

          totalUpdated++
        }
      }

      await new Promise(r => setTimeout(r, 1000))
    } catch (err) {
      console.error(`Error syncing set ${set.id}:`, err)
    }
  }

  return NextResponse.json({ success: true, totalUpdated })
}

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

  // Sync ALL English sets, batched by release date (newest first)
  // Process in batches to stay within Vercel function timeout
  const sets = await prisma.set.findMany({
    where: { language: 'en' },
    orderBy: { releaseDate: 'desc' },
    select: { id: true, name: true },
  })

  let totalUpdated = 0
  let setsProcessed = 0
  const errors: string[] = []

  for (const set of sets) {
    try {
      // Paginate through all cards in the set
      let page = 1
      let hasMore = true

      while (hasMore) {
        const res = await fetch(
          `${BASE_URL}/cards?q=set.id:${set.id}&pageSize=250&page=${page}`,
          { headers }
        )
        if (!res.ok) {
          if (res.status === 429) {
            // Rate limited — wait and retry
            await new Promise(r => setTimeout(r, 10000))
            continue
          }
          break
        }

        const data = await res.json()
        const cards = data.data || []

        // Batch upsert prices
        const ops: Promise<any>[] = []
        for (const card of cards) {
          const prices = card.tcgplayer?.prices
          if (!prices) continue

          for (const [variant, p] of Object.entries(prices) as [string, any][]) {
            ops.push(
              prisma.cardPrice.upsert({
                where: { cardId_variant_source: { cardId: card.id, variant, source: 'tcgplayer' } },
                create: {
                  cardId: card.id,
                  variant,
                  source: 'tcgplayer',
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
            )

            // Record price history
            if (p.market) {
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              ops.push(
                prisma.priceHistory.upsert({
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
              )
            }

            totalUpdated++
          }
        }

        // Execute in batches of 50
        for (let i = 0; i < ops.length; i += 50) {
          await Promise.all(ops.slice(i, i + 50))
        }

        hasMore = (data.data?.length || 0) === 250
        page++
      }

      setsProcessed++
      // Rate limit: 1s between sets
      await new Promise(r => setTimeout(r, 1000))
    } catch (err: any) {
      errors.push(`${set.id}: ${err.message}`)
    }
  }

  // ─── eBay price sync for top cards ───
  let ebayUpdated = 0
  if (process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET) {
    try {
      const { searchEbayPrices } = await import('@/lib/pricing/ebay')

      // Get top 50 most valuable cards for eBay price check
      const topCards = await prisma.cardPrice.findMany({
        where: { source: 'tcgplayer', market: { not: null, gt: 10 } },
        orderBy: { market: 'desc' },
        take: 50,
        include: {
          card: { include: { set: { select: { name: true } } } },
        },
      })

      for (const item of topCards) {
        try {
          const ebayResult = await searchEbayPrices(item.card.name, item.card.set.name)
          if (ebayResult.avgPrice !== null) {
            await prisma.cardPrice.upsert({
              where: {
                cardId_variant_source: {
                  cardId: item.cardId,
                  variant: item.variant,
                  source: 'ebay',
                },
              },
              create: {
                cardId: item.cardId,
                variant: item.variant,
                source: 'ebay',
                low: ebayResult.lowPrice,
                mid: ebayResult.avgPrice,
                high: ebayResult.highPrice,
                market: ebayResult.avgPrice,
              },
              update: {
                low: ebayResult.lowPrice,
                mid: ebayResult.avgPrice,
                high: ebayResult.highPrice,
                market: ebayResult.avgPrice,
                updatedAt: new Date(),
              },
            })
            ebayUpdated++
          }
          await new Promise(r => setTimeout(r, 500))
        } catch {
          // Skip individual card errors
        }
      }
    } catch (err: any) {
      errors.push(`eBay sync: ${err.message}`)
    }
  }

  // ─── Graded price sync for top cards ───
  let gradedUpdated = 0
  if (process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET) {
    try {
      const { fetchPSAPrices } = await import('@/lib/pricing/psa')

      // Get top 20 most valuable cards for graded price check
      const topCards = await prisma.cardPrice.findMany({
        where: { source: 'tcgplayer', market: { not: null, gt: 25 } },
        orderBy: { market: 'desc' },
        take: 20,
        include: {
          card: { include: { set: { select: { name: true } } } },
        },
      })

      for (const item of topCards) {
        try {
          const gradedPrices = await fetchPSAPrices(item.card.name, item.card.set.name)
          for (const gp of gradedPrices) {
            if (gp.price === null) continue
            await prisma.gradedPrice.upsert({
              where: {
                cardId_gradingCompany_grade: {
                  cardId: item.cardId,
                  gradingCompany: gp.gradingCompany,
                  grade: gp.grade,
                },
              },
              create: {
                cardId: item.cardId,
                gradingCompany: gp.gradingCompany,
                grade: gp.grade,
                price: gp.price,
                source: gp.source,
              },
              update: {
                price: gp.price,
                source: gp.source,
                updatedAt: new Date(),
              },
            })
            gradedUpdated++
          }
          await new Promise(r => setTimeout(r, 2000))
        } catch {
          // Skip individual card errors
        }
      }
    } catch (err: any) {
      errors.push(`Graded sync: ${err.message}`)
    }
  }

  return NextResponse.json({
    success: true,
    tcgplayer: { setsProcessed, totalUpdated },
    ebay: { updated: ebayUpdated },
    graded: { updated: gradedUpdated },
    errors: errors.length > 0 ? errors : undefined,
  })
}

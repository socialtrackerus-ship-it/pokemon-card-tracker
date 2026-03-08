/**
 * Sync eBay market prices for top-value cards.
 *
 * Fetches active eBay listing prices for cards that already have TCGPlayer prices,
 * giving collectors a second price reference point.
 *
 * Usage: npx tsx scripts/sync-ebay-prices.ts
 *
 * Required env vars:
 *   DATABASE_URL
 *   EBAY_CLIENT_ID
 *   EBAY_CLIENT_SECRET
 */

import { PrismaClient } from '@prisma/client'
import { searchEbayPrices, isEbayConfigured } from '../src/lib/pricing/ebay'

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
})

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function syncEbayPrices() {
  if (!isEbayConfigured()) {
    console.error('eBay API not configured. Set EBAY_CLIENT_ID and EBAY_CLIENT_SECRET.')
    process.exit(1)
  }

  // Get cards with TCGPlayer prices > $5 (worth tracking on eBay)
  const cardsToSync = await prisma.cardPrice.findMany({
    where: {
      source: 'tcgplayer',
      market: { not: null, gt: 5 },
    },
    orderBy: { market: 'desc' },
    take: 200, // Top 200 most valuable cards
    include: {
      card: {
        include: { set: { select: { name: true } } },
      },
    },
  })

  console.log(`Syncing eBay prices for ${cardsToSync.length} cards...\n`)

  let updated = 0
  let errors = 0

  for (let i = 0; i < cardsToSync.length; i++) {
    const item = cardsToSync[i]
    const cardName = item.card.name
    const setName = item.card.set.name

    console.log(`[${i + 1}/${cardsToSync.length}] ${cardName} (${setName}) — TCG: $${item.market?.toFixed(2)}`)

    try {
      const ebayResult = await searchEbayPrices(cardName, setName)

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
        console.log(`  eBay: $${ebayResult.avgPrice} (${ebayResult.listingCount} listings)`)
        updated++
      } else {
        console.log(`  No eBay listings found`)
      }

      // Rate limit: ~2 requests per second
      await delay(500)
    } catch (err: any) {
      console.error(`  Error: ${err.message}`)
      errors++
      await delay(2000)
    }
  }

  console.log(`\nDone! Updated: ${updated}, Errors: ${errors}`)
  await prisma.$disconnect()
}

syncEbayPrices().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})

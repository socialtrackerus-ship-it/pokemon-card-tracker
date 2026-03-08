/**
 * Sync graded card prices (PSA, BGS, CGC) from eBay market data.
 *
 * Searches eBay for graded Pokemon cards and stores prices in the GradedPrice table.
 * Focuses on high-value cards where grading is most relevant.
 *
 * Usage: npx tsx scripts/sync-graded-prices.ts
 *
 * Required env vars:
 *   DATABASE_URL
 *   EBAY_CLIENT_ID
 *   EBAY_CLIENT_SECRET
 */

import { PrismaClient } from '@prisma/client'
import { fetchAllGradedPrices } from '../src/lib/pricing/psa'
import { isEbayConfigured } from '../src/lib/pricing/ebay'

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
})

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function syncGradedPrices() {
  if (!isEbayConfigured()) {
    console.error('eBay API not configured. Set EBAY_CLIENT_ID and EBAY_CLIENT_SECRET.')
    process.exit(1)
  }

  // Get cards worth grading — those with market price > $20
  const cardsToSync = await prisma.cardPrice.findMany({
    where: {
      source: 'tcgplayer',
      market: { not: null, gt: 20 },
    },
    orderBy: { market: 'desc' },
    take: 100, // Top 100 most valuable cards
    include: {
      card: {
        include: { set: { select: { name: true } } },
      },
    },
  })

  console.log(`Syncing graded prices for ${cardsToSync.length} cards...\n`)

  let updated = 0
  let errors = 0

  for (let i = 0; i < cardsToSync.length; i++) {
    const item = cardsToSync[i]
    const cardName = item.card.name
    const setName = item.card.set.name

    console.log(`[${i + 1}/${cardsToSync.length}] ${cardName} (${setName}) — Raw: $${item.market?.toFixed(2)}`)

    try {
      const gradedPrices = await fetchAllGradedPrices(cardName, setName)

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
        console.log(`  ${gp.gradingCompany} ${gp.grade}: $${gp.price.toFixed(2)} (${gp.listingCount} listings)`)
        updated++
      }

      // Longer delay between cards since each card makes multiple eBay requests
      await delay(2000)
    } catch (err: any) {
      console.error(`  Error: ${err.message}`)
      errors++
      await delay(5000)
    }
  }

  console.log(`\nDone! Graded prices updated: ${updated}, Errors: ${errors}`)
  await prisma.$disconnect()
}

syncGradedPrices().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})

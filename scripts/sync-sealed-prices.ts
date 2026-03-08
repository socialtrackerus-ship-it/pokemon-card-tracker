/**
 * Sync sealed product prices for sets.
 *
 * Fetches eBay market prices for sealed Pokemon TCG products:
 *   - Booster Box
 *   - Elite Trainer Box (ETB)
 *   - Booster Bundle
 *   - Booster Pack
 *
 * Usage: npx tsx scripts/sync-sealed-prices.ts
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

const PRODUCT_TYPES = [
  { type: 'booster_box', searchSuffix: 'booster box sealed' },
  { type: 'etb', searchSuffix: 'elite trainer box sealed' },
  { type: 'booster_bundle', searchSuffix: 'booster bundle sealed' },
  { type: 'booster_pack', searchSuffix: 'booster pack sealed' },
]

async function syncSealedPrices() {
  if (!isEbayConfigured()) {
    console.error('eBay API not configured. Set EBAY_CLIENT_ID and EBAY_CLIENT_SECRET.')
    process.exit(1)
  }

  // Get all sets ordered by most recent
  const sets = await prisma.set.findMany({
    orderBy: { releaseDate: 'desc' },
    select: { id: true, name: true, language: true },
  })

  console.log(`Syncing sealed prices for ${sets.length} sets...\n`)

  let updated = 0
  let errors = 0

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i]
    const langLabel = set.language === 'en' ? '' : ` [${set.language.toUpperCase()}]`
    console.log(`[${i + 1}/${sets.length}] ${set.name}${langLabel}`)

    for (const product of PRODUCT_TYPES) {
      try {
        // Build search query including language-specific terms
        let langTerm = ''
        if (set.language === 'ja') langTerm = 'japanese'
        else if (set.language === 'ko') langTerm = 'korean'
        else if (set.language === 'zh') langTerm = 'chinese'

        const result = await searchEbayPrices(
          `pokemon ${set.name} ${langTerm}`.trim(),
          product.searchSuffix
        )

        if (result.avgPrice !== null) {
          await prisma.sealedProduct.upsert({
            where: {
              setId_productType_source: {
                setId: set.id,
                productType: product.type,
                source: 'ebay',
              },
            },
            create: {
              setId: set.id,
              name: `${set.name} ${product.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
              productType: product.type,
              source: 'ebay',
              low: result.lowPrice,
              market: result.avgPrice,
              high: result.highPrice,
            },
            update: {
              low: result.lowPrice,
              market: result.avgPrice,
              high: result.highPrice,
              updatedAt: new Date(),
            },
          })
          console.log(`  ${product.type}: $${result.avgPrice} (${result.listingCount} listings)`)
          updated++
        }

        await delay(400)
      } catch (err: any) {
        errors++
      }
    }

    // Rate limit between sets
    await delay(500)
  }

  console.log(`\nDone! Sealed prices updated: ${updated}, Errors: ${errors}`)
  await prisma.$disconnect()
}

syncSealedPrices().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})

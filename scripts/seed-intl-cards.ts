/**
 * Seed cards for Japanese, Korean, and Chinese sets by cloning from English equivalents.
 *
 * Since non-English card data isn't available from the Pokemon TCG API,
 * we map each non-English set to its English counterpart and clone the cards
 * with adjusted IDs. The images use the English card images (same artwork).
 *
 * Usage: npx tsx scripts/seed-intl-cards.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Map non-English set base IDs to their English equivalents
// Japanese set IDs in the DB have "ja-" prefix, Korean "ko-", Chinese "zh-"
const SET_MAPPING: Record<string, string> = {
  // Japanese -> English
  'ja-sv8a': 'sv8pt5',
  'ja-sv7a': 'sv6pt5',
  'ja-sv7': 'sv7',
  'ja-sv6a': 'sv6',
  'ja-sv6': 'sv6',
  'ja-sv5a': 'sv5',
  'ja-sv5': 'sv5',
  'ja-sv5m': 'sv5',
  'ja-sv4a': 'sv4pt5',
  'ja-sv4': 'sv4',
  'ja-sv4m': 'sv4',
  'ja-sv3a': 'sv3',
  'ja-sv3': 'sv3',
  'ja-sv2a': 'sv3pt5',
  'ja-sv2': 'sv2',
  'ja-sv2m': 'sv2',
  'ja-sv1a': 'sv1',
  'ja-sv1': 'sv1',
  'ja-sv1m': 'sv1',
  'ja-s12a': 'swsh12pt5',
  'ja-s12': 'swsh12',
  'ja-s11a': 'swsh11',
  'ja-s11': 'swsh11',
  'ja-s10a': 'swsh10',
  'ja-s10': 'swsh10',
  'ja-s10m': 'swsh10',
  'ja-s9a': 'swsh9',
  'ja-s9': 'swsh9',
  'ja-s8a': 'cel25',
  'ja-s8b': 'swsh12pt5',

  // Korean -> English (IDs in DB have ko-XXX-ko format)
  'ko-sv8a-ko': 'sv8pt5',
  'ko-sv7-ko': 'sv7',
  'ko-sv6-ko': 'sv6',
  'ko-sv5-ko': 'sv5',
  'ko-sv4a-ko': 'sv4pt5',
  'ko-sv4-ko': 'sv4',
  'ko-sv3-ko': 'sv3',
  'ko-sv2a-ko': 'sv3pt5',
  'ko-sv2-ko': 'sv2',
  'ko-sv1-ko': 'sv1',
  'ko-s12a-ko': 'swsh12pt5',
  'ko-s12-ko': 'swsh12',
  'ko-s11-ko': 'swsh11',
  'ko-s10-ko': 'swsh10',
  'ko-s9-ko': 'swsh9',
  'ko-s8b-ko': 'swsh12pt5',

  // Chinese -> English (IDs in DB have zh-XXX-zh format)
  'zh-sv7-zh': 'sv7',
  'zh-sv6-zh': 'sv6',
  'zh-sv5-zh': 'sv5',
  'zh-sv4a-zh': 'sv4pt5',
  'zh-sv3-zh': 'sv3',
  'zh-sv2a-zh': 'sv3pt5',
  'zh-sv2-zh': 'sv2',
  'zh-sv1-zh': 'sv1',
  'zh-s12a-zh': 'swsh12pt5',
  'zh-s12-zh': 'swsh12',
  'zh-s11-zh': 'swsh11',
  'zh-s9-zh': 'swsh9',
}

async function main() {
  // Get all non-English sets
  const intlSets = await prisma.set.findMany({
    where: { language: { not: 'en' } },
    orderBy: { releaseDate: 'desc' },
    select: { id: true, name: true, language: true, printedTotal: true },
  })

  console.log(`Found ${intlSets.length} non-English sets\n`)

  let totalCloned = 0
  let skippedExisting = 0
  let skippedNoMapping = 0

  for (const set of intlSets) {
    const englishSetId = SET_MAPPING[set.id]

    if (!englishSetId) {
      console.log(`[SKIP] ${set.name} (${set.id}) — no English mapping`)
      skippedNoMapping++
      continue
    }

    // Check if this set already has cards
    const existingCount = await prisma.card.count({ where: { setId: set.id } })
    if (existingCount > 0) {
      console.log(`[SKIP] ${set.name} (${set.id}) — already has ${existingCount} cards`)
      skippedExisting++
      continue
    }

    // Get English cards to clone
    const englishCards = await prisma.card.findMany({
      where: { setId: englishSetId },
      orderBy: { number: 'asc' },
    })

    if (englishCards.length === 0) {
      console.log(`[SKIP] ${set.name} (${set.id}) — English set ${englishSetId} has no cards`)
      continue
    }

    // Limit to printedTotal if the non-English set has fewer cards
    const cardsToClone = set.printedTotal > 0 && set.printedTotal < englishCards.length
      ? englishCards.slice(0, set.printedTotal)
      : englishCards

    console.log(`[CLONE] ${set.name} (${set.id}) <- ${englishSetId} (${cardsToClone.length} cards)`)

    // Clone cards in batches
    const BATCH_SIZE = 50
    for (let i = 0; i < cardsToClone.length; i += BATCH_SIZE) {
      const batch = cardsToClone.slice(i, i + BATCH_SIZE)
      await prisma.$transaction(
        batch.map(card =>
          prisma.card.create({
            data: {
              id: `${set.id}-${card.number}`,
              setId: set.id,
              name: card.name,
              supertype: card.supertype,
              subtypes: card.subtypes,
              hp: card.hp,
              types: card.types,
              rarity: card.rarity,
              // Use the English card images (same artwork)
              imageSmall: card.imageSmall,
              imageLarge: card.imageLarge,
              number: card.number,
              artist: card.artist,
              tcgplayerUrl: null, // Non-English cards don't have TCGPlayer listings
              attacks: card.attacks,
              abilities: card.abilities,
            },
          })
        )
      )
    }

    totalCloned += cardsToClone.length
    console.log(`  Cloned ${cardsToClone.length} cards`)
  }

  // Also update non-English set logos/symbols from their English equivalents
  console.log(`\nUpdating set images from English equivalents...`)
  let imagesUpdated = 0
  for (const set of intlSets) {
    const englishSetId = SET_MAPPING[set.id]
    if (!englishSetId) continue

    const englishSet = await prisma.set.findUnique({
      where: { id: englishSetId },
      select: { logoUrl: true, symbolUrl: true },
    })
    if (!englishSet?.logoUrl) continue

    await prisma.set.update({
      where: { id: set.id },
      data: {
        logoUrl: englishSet.logoUrl,
        symbolUrl: englishSet.symbolUrl,
      },
    })
    imagesUpdated++
  }

  console.log(`\nDone!`)
  console.log(`  Cards cloned: ${totalCloned}`)
  console.log(`  Set images updated: ${imagesUpdated}`)
  console.log(`  Skipped (already have cards): ${skippedExisting}`)
  console.log(`  Skipped (no English mapping): ${skippedNoMapping}`)
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})

/**
 * Sync card data from TCGdex API (https://api.tcgdex.net/v2)
 *
 * - Updates non-English cards (JA/KO/ZH) with proper images and localized names
 * - Syncs Cardmarket pricing for English cards (free alternative to pokemontcg.io)
 * - Updates set logos from TCGdex
 *
 * Usage:
 *   npx tsx scripts/sync-tcgdex.ts                    # sync everything
 *   npx tsx scripts/sync-tcgdex.ts --images-only       # only sync non-EN images/names
 *   npx tsx scripts/sync-tcgdex.ts --prices-only       # only sync EN Cardmarket prices
 *   npx tsx scripts/sync-tcgdex.ts --logos-only        # only sync set logos
 *   npx tsx scripts/sync-tcgdex.ts --images-only --force # re-sync all non-EN cards
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TCGDEX_BASE = 'https://api.tcgdex.net/v2'

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function tcgdexFetch(url: string, retries = 3): Promise<any | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
      if (res.ok) return res.json()
      if (res.status === 429) {
        console.log(`  Rate limited, waiting ${(i + 1) * 3}s...`)
        await delay((i + 1) * 3000)
        continue
      }
      if (res.status === 404) return null
      console.log(`  HTTP ${res.status} for ${url}`)
      return null
    } catch (err: any) {
      if (i < retries - 1) {
        await delay(2000)
        continue
      }
      console.log(`  Fetch failed: ${err.message}`)
      return null
    }
  }
  return null
}

// ─── Non-English Set ID → TCGdex Set ID + Locale Mapping ───

interface TcgdexMapping {
  tcgdexSetId: string
  locale: string // ja, ko, zh-tw
}

// Manual mapping: our DB set ID → TCGdex set ID + locale
const INTL_SET_MAP: Record<string, TcgdexMapping> = {
  // ── Japanese SV Era ──
  'ja-sv8a':  { tcgdexSetId: 'SV8a', locale: 'ja' },
  'ja-sv7a':  { tcgdexSetId: 'SV7a', locale: 'ja' },
  'ja-sv7':   { tcgdexSetId: 'SV7',  locale: 'ja' },
  'ja-sv6a':  { tcgdexSetId: 'SV6a', locale: 'ja' },
  'ja-sv6':   { tcgdexSetId: 'SV6',  locale: 'ja' },
  'ja-sv5a':  { tcgdexSetId: 'SV5a', locale: 'ja' },
  'ja-sv5':   { tcgdexSetId: 'SV5K', locale: 'ja' },
  'ja-sv5m':  { tcgdexSetId: 'SV5M', locale: 'ja' },
  'ja-sv4a':  { tcgdexSetId: 'SV4a', locale: 'ja' },
  'ja-sv4':   { tcgdexSetId: 'SV4K', locale: 'ja' },
  'ja-sv4m':  { tcgdexSetId: 'SV4M', locale: 'ja' },
  'ja-sv3a':  { tcgdexSetId: 'SV3a', locale: 'ja' },
  'ja-sv3':   { tcgdexSetId: 'SV3',  locale: 'ja' },
  'ja-sv2a':  { tcgdexSetId: 'SV2a', locale: 'ja' },
  'ja-sv2':   { tcgdexSetId: 'SV2D', locale: 'ja' },
  'ja-sv2m':  { tcgdexSetId: 'SV2P', locale: 'ja' },
  'ja-sv1a':  { tcgdexSetId: 'SV1a', locale: 'ja' },
  'ja-sv1':   { tcgdexSetId: 'SV1S', locale: 'ja' },
  'ja-sv1m':  { tcgdexSetId: 'SV1V', locale: 'ja' },
  // ── Japanese SWSH Era ──
  'ja-s12a':  { tcgdexSetId: 'S12a', locale: 'ja' },
  'ja-s12':   { tcgdexSetId: 'S12',  locale: 'ja' },
  'ja-s11a':  { tcgdexSetId: 'S11a', locale: 'ja' },
  'ja-s11':   { tcgdexSetId: 'S11',  locale: 'ja' },
  'ja-s10a':  { tcgdexSetId: 'S10a', locale: 'ja' },
  'ja-s10':   { tcgdexSetId: 'S10D', locale: 'ja' },
  'ja-s10m':  { tcgdexSetId: 'S10P', locale: 'ja' },
  'ja-s9a':   { tcgdexSetId: 'S9a',  locale: 'ja' },
  'ja-s9':    { tcgdexSetId: 'S9',   locale: 'ja' },
  'ja-s8a':   { tcgdexSetId: 'S8a',  locale: 'ja' },
  'ja-s8b':   { tcgdexSetId: 'S8b',  locale: 'ja' },

  // ── Korean SV Era ──
  'ko-sv8a-ko': { tcgdexSetId: 'SV8a', locale: 'ko' },
  'ko-sv7-ko':  { tcgdexSetId: 'SV7',  locale: 'ko' },
  'ko-sv6-ko':  { tcgdexSetId: 'SV6',  locale: 'ko' },
  'ko-sv5-ko':  { tcgdexSetId: 'SV5K', locale: 'ko' },
  'ko-sv4a-ko': { tcgdexSetId: 'SV4a', locale: 'ko' },
  'ko-sv4-ko':  { tcgdexSetId: 'SV4K', locale: 'ko' },
  'ko-sv3-ko':  { tcgdexSetId: 'SV3',  locale: 'ko' },
  'ko-sv2a-ko': { tcgdexSetId: 'SV2a', locale: 'ko' },
  'ko-sv2-ko':  { tcgdexSetId: 'SV2D', locale: 'ko' },
  'ko-sv1-ko':  { tcgdexSetId: 'SV1S', locale: 'ko' },
  // ── Korean SWSH Era ──
  'ko-s12a-ko': { tcgdexSetId: 'S12a', locale: 'ko' },
  'ko-s12-ko':  { tcgdexSetId: 'S12',  locale: 'ko' },
  'ko-s11-ko':  { tcgdexSetId: 'S11',  locale: 'ko' },
  'ko-s10-ko':  { tcgdexSetId: 'S10D', locale: 'ko' },
  'ko-s9-ko':   { tcgdexSetId: 'S9',   locale: 'ko' },
  'ko-s8b-ko':  { tcgdexSetId: 'S8b',  locale: 'ko' },

  // ── Chinese (Traditional) SV Era ──
  'zh-sv7-zh':  { tcgdexSetId: 'SV7',  locale: 'zh-tw' },
  'zh-sv6-zh':  { tcgdexSetId: 'SV6',  locale: 'zh-tw' },
  'zh-sv5-zh':  { tcgdexSetId: 'SV5K', locale: 'zh-tw' },
  'zh-sv4a-zh': { tcgdexSetId: 'SV4a', locale: 'zh-tw' },
  'zh-sv3-zh':  { tcgdexSetId: 'SV3',  locale: 'zh-tw' },
  'zh-sv2a-zh': { tcgdexSetId: 'SV2a', locale: 'zh-tw' },
  'zh-sv2-zh':  { tcgdexSetId: 'SV2D', locale: 'zh-tw' },
  'zh-sv1-zh':  { tcgdexSetId: 'SV1S', locale: 'zh-tw' },
  // ── Chinese SWSH Era ──
  'zh-s12a-zh': { tcgdexSetId: 'S12a', locale: 'zh-tw' },
  'zh-s12-zh':  { tcgdexSetId: 'S12',  locale: 'zh-tw' },
  'zh-s11-zh':  { tcgdexSetId: 'S11',  locale: 'zh-tw' },
  'zh-s9-zh':   { tcgdexSetId: 'S9',   locale: 'zh-tw' },
}

// ─── English Set ID → TCGdex Set ID Mapping ───
// pokemontcg.io uses IDs like "sv7", TCGdex uses "sv07"

function toTcgdexEnglishSetId(pokemonTcgSetId: string): string | null {
  // SV era: sv1 → sv01, sv2 → sv02, sv3pt5 → sv03.5, sv4pt5 → sv04.5
  const svMatch = pokemonTcgSetId.match(/^sv(\d+)(pt5)?$/)
  if (svMatch) {
    const num = svMatch[1].padStart(2, '0')
    const half = svMatch[2] ? '.5' : ''
    return `sv${num}${half}`
  }

  // SWSH era: swsh1 → swsh1, swsh12pt5 → swsh12.5
  const swshMatch = pokemonTcgSetId.match(/^swsh(\d+)(pt5)?$/)
  if (swshMatch) {
    const half = swshMatch[2] ? '.5' : ''
    return `swsh${swshMatch[1]}${half}`
  }

  // SM era: sm1 → sm1, sm3.5 → sm3.5
  const smMatch = pokemonTcgSetId.match(/^sm(\d+)$/)
  if (smMatch) return pokemonTcgSetId

  // Other sets: try as-is (base1, xy1, etc.)
  return pokemonTcgSetId
}

// ─── Sync Non-English Cards from TCGdex ───
// Deletes old cloned cards (they had wrong numbers/names from English sets)
// and recreates them from TCGdex with correct localized data.

async function syncIntlCards(force = false) {
  console.log('═══ Syncing non-English cards from TCGdex ═══\n')

  const intlSets = await prisma.set.findMany({
    where: { language: { not: 'en' } },
    orderBy: { releaseDate: 'desc' },
    select: { id: true, name: true, language: true, printedTotal: true },
  })

  let totalCreated = 0
  let setsProcessed = 0
  let setsSkipped = 0

  for (const set of intlSets) {
    const mapping = INTL_SET_MAP[set.id]
    if (!mapping) {
      console.log(`[SKIP] ${set.name} (${set.id}) — no TCGdex mapping`)
      setsSkipped++
      continue
    }

    // Fetch set data from TCGdex (includes card list with names + images)
    const setUrl = `${TCGDEX_BASE}/${mapping.locale}/sets/${mapping.tcgdexSetId}`
    const setData = await tcgdexFetch(setUrl)

    if (!setData || !setData.cards || setData.cards.length === 0) {
      console.log(`[SKIP] ${set.name} (${set.id}) — not found on TCGdex (${mapping.locale}/${mapping.tcgdexSetId})`)
      setsSkipped++
      await delay(500)
      continue
    }

    // Check if cards already have images (already synced from TCGdex)
    if (!force) {
      const existingWithImages = await prisma.card.count({
        where: { setId: set.id, imageSmall: { not: '' } },
      })
      if (existingWithImages > 10) {
        console.log(`[SKIP] ${set.name} (${set.id}) — already has ${existingWithImages} cards with images (use --force)`)
        setsSkipped++
        continue
      }
    }

    // Delete old cloned cards (they have wrong English data)
    const deleted = await prisma.card.deleteMany({ where: { setId: set.id } })
    if (deleted.count > 0) {
      console.log(`  Deleted ${deleted.count} old cloned cards for ${set.id}`)
    }

    // Update set name to localized name from TCGdex
    if (setData.name) {
      await prisma.set.update({
        where: { id: set.id },
        data: { name: setData.name },
      })
    }

    // Update set logo if available
    if (setData.logo) {
      await prisma.set.update({
        where: { id: set.id },
        data: { logoUrl: `${setData.logo}.webp` },
      })
    }
    if (setData.symbol) {
      await prisma.set.update({
        where: { id: set.id },
        data: { symbolUrl: `${setData.symbol}.webp` },
      })
    }

    // Create cards from TCGdex data
    // The set listing gives us: localId, name, image for each card
    // We need to fetch individual card details for rarity, type, HP, etc.
    const BATCH_SIZE = 20
    let created = 0

    for (let i = 0; i < setData.cards.length; i += BATCH_SIZE) {
      const batch = setData.cards.slice(i, i + BATCH_SIZE)
      const cardCreates: any[] = []

      for (const tcgCard of batch) {
        // Fetch full card detail
        const cardUrl = `${TCGDEX_BASE}/${mapping.locale}/cards/${mapping.tcgdexSetId}-${tcgCard.localId}`
        const detail = await tcgdexFetch(cardUrl)

        const imageBase = tcgCard.image || `https://assets.tcgdex.net/${mapping.locale}/SV/${mapping.tcgdexSetId}/${tcgCard.localId}`

        cardCreates.push({
          id: `${set.id}-${tcgCard.localId}`,
          setId: set.id,
          name: tcgCard.name || detail?.name || 'Unknown',
          supertype: detail?.category || 'Pokémon',
          subtypes: detail?.stage ? [detail.stage] : null,
          hp: detail?.hp ? String(detail.hp) : null,
          types: detail?.types || null,
          rarity: detail?.rarity || null,
          imageSmall: `${imageBase}/low.webp`,
          imageLarge: `${imageBase}/high.webp`,
          number: tcgCard.localId,
          artist: detail?.illustrator || null,
          attacks: detail?.attacks || null,
          abilities: detail?.abilities || null,
        })

        await delay(80)
      }

      // Insert batch
      if (cardCreates.length > 0) {
        await prisma.$transaction(
          cardCreates.map(data => prisma.card.create({ data }))
        )
        created += cardCreates.length
      }
    }

    console.log(`[OK] ${setData.name || set.name} (${set.id}) — created ${created} cards from TCGdex`)
    totalCreated += created
    setsProcessed++
    await delay(500)
  }

  console.log(`\nCards sync done: ${totalCreated} cards created across ${setsProcessed} sets (${setsSkipped} skipped)`)
}

// ─── Sync Set Logos ───

async function syncSetLogos() {
  console.log('\n═══ Syncing set logos from TCGdex ═══\n')

  const allSets = await prisma.set.findMany({
    select: { id: true, name: true, language: true, logoUrl: true, symbolUrl: true },
    orderBy: { releaseDate: 'desc' },
  })

  let updated = 0

  for (const set of allSets) {
    // Only update sets missing logos
    if (set.logoUrl && set.symbolUrl) continue

    let tcgdexSetId: string
    let locale: string

    if (set.language === 'en') {
      locale = 'en'
      const mapped = toTcgdexEnglishSetId(set.id)
      if (!mapped) continue
      tcgdexSetId = mapped
    } else {
      // For non-English sets, try to get logo from English version of the set on TCGdex
      // Non-English TCGdex sets don't have logo/symbol fields
      const mapping = INTL_SET_MAP[set.id]
      if (!mapping) continue
      // Use English locale to fetch set data for logo
      locale = 'en'
      // Try to find the English TCGdex equivalent
      // The English TCGdex IDs are different from Japanese ones
      // e.g., JA SV7 → EN sv07
      const enEquivalent = tcgdexSetIdToEnglish(mapping.tcgdexSetId)
      if (!enEquivalent) continue
      tcgdexSetId = enEquivalent
    }

    const setUrl = `${TCGDEX_BASE}/${locale}/sets/${tcgdexSetId}`
    const setData = await tcgdexFetch(setUrl)

    if (!setData) {
      await delay(300)
      continue
    }

    const updateData: any = {}
    if (!set.logoUrl && setData.logo) {
      updateData.logoUrl = `${setData.logo}.webp`
    }
    if (!set.symbolUrl && setData.symbol) {
      updateData.symbolUrl = `${setData.symbol}.webp`
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.set.update({ where: { id: set.id }, data: updateData })
      console.log(`[OK] ${set.name} (${set.id}) — logo: ${!!updateData.logoUrl}, symbol: ${!!updateData.symbolUrl}`)
      updated++
    }

    await delay(300)
  }

  console.log(`\nLogos sync done: ${updated} sets updated`)
}

// Map Japanese/Korean/Chinese TCGdex set IDs to English TCGdex set IDs
function tcgdexSetIdToEnglish(intlSetId: string): string | null {
  const map: Record<string, string> = {
    // SV Era
    'SV8a': 'sv08.5',
    'SV7a': 'sv06.5',
    'SV7': 'sv07',
    'SV6a': 'sv06.5',
    'SV6': 'sv06',
    'SV5a': 'sv05',
    'SV5K': 'sv05',
    'SV5M': 'sv05',
    'SV4a': 'sv04.5',
    'SV4K': 'sv04',
    'SV4M': 'sv04',
    'SV3a': 'sv03',
    'SV3': 'sv03',
    'SV2a': 'sv03.5',
    'SV2D': 'sv02',
    'SV2P': 'sv02',
    'SV1a': 'sv01',
    'SV1S': 'sv01',
    'SV1V': 'sv01',
    // SWSH Era
    'S12a': 'swsh12.5',
    'S12': 'swsh12',
    'S11a': 'swsh11',
    'S11': 'swsh11',
    'S10a': 'swsh10',
    'S10D': 'swsh10',
    'S10P': 'swsh10',
    'S9a': 'swsh9',
    'S9': 'swsh9',
    'S8a': 'cel25',
    'S8b': 'swsh12.5',
  }
  return map[intlSetId] || null
}

// ─── Sync Cardmarket Pricing for English Cards ───

async function syncCardmarketPrices() {
  console.log('\n═══ Syncing Cardmarket prices from TCGdex ═══\n')

  // Get all English sets
  const enSets = await prisma.set.findMany({
    where: { language: 'en' },
    orderBy: { releaseDate: 'desc' },
    select: { id: true, name: true },
  })

  let totalPrices = 0
  let setsWithPrices = 0

  for (let i = 0; i < enSets.length; i++) {
    const set = enSets[i]
    const tcgdexSetId = toTcgdexEnglishSetId(set.id)
    if (!tcgdexSetId) {
      console.log(`[SKIP] ${set.name} (${set.id}) — can't map to TCGdex`)
      continue
    }

    process.stdout.write(`[${i + 1}/${enSets.length}] ${set.name}... `)

    // Get our cards for this set
    const ourCards = await prisma.card.findMany({
      where: { setId: set.id },
      select: { id: true, number: true },
    })

    if (ourCards.length === 0) {
      console.log('no cards')
      continue
    }

    // Check if this set already has cardmarket prices
    const existingPrices = await prisma.cardPrice.count({
      where: {
        card: { setId: set.id },
        source: 'cardmarket',
      },
    })

    if (existingPrices > 0) {
      console.log(`already has ${existingPrices} cardmarket prices`)
      continue
    }

    // Fetch set from TCGdex to get card list
    const setUrl = `${TCGDEX_BASE}/en/sets/${tcgdexSetId}`
    const setData = await tcgdexFetch(setUrl)

    if (!setData || !setData.cards) {
      console.log('not found on TCGdex')
      await delay(500)
      continue
    }

    // Build number → our card ID map (normalize: strip leading zeros)
    const numberToCardId = new Map<string, string>()
    for (const card of ourCards) {
      numberToCardId.set(card.number, card.id)
    }

    // Fetch card details in parallel batches for pricing
    let setPrices = 0
    const ops: any[] = []
    const PARALLEL = 10

    // Filter to cards we actually have
    const matchedCards: { tcgdexLocalId: string; ourCardId: string }[] = []
    for (const tcgdexCard of setData.cards) {
      const normalizedNum = tcgdexCard.localId.replace(/^0+/, '') || '0'
      const ourCardId = numberToCardId.get(normalizedNum) || numberToCardId.get(tcgdexCard.localId)
      if (ourCardId) {
        matchedCards.push({ tcgdexLocalId: tcgdexCard.localId, ourCardId })
      }
    }

    for (let b = 0; b < matchedCards.length; b += PARALLEL) {
      const batch = matchedCards.slice(b, b + PARALLEL)
      const results = await Promise.all(
        batch.map(({ tcgdexLocalId }) =>
          tcgdexFetch(`${TCGDEX_BASE}/en/cards/${tcgdexSetId}-${tcgdexLocalId}`)
        )
      )

      for (let k = 0; k < results.length; k++) {
        const cardDetail = results[k]
        const { ourCardId } = batch[k]
        if (!cardDetail?.pricing?.cardmarket) continue

        const cm = cardDetail.pricing.cardmarket
        if (cm.avg == null && cm.low == null && cm.trend == null) continue

        ops.push(
          prisma.cardPrice.upsert({
            where: {
              cardId_variant_source: {
                cardId: ourCardId,
                variant: 'normal',
                source: 'cardmarket',
              },
            },
            create: {
              cardId: ourCardId,
              variant: 'normal',
              source: 'cardmarket',
              low: cm.low ?? null,
              mid: cm.avg ?? null,
              high: null,
              market: cm.trend ?? cm.avg ?? null,
            },
            update: {
              low: cm.low ?? null,
              mid: cm.avg ?? null,
              market: cm.trend ?? cm.avg ?? null,
              updatedAt: new Date(),
            },
          })
        )
      }

      await delay(200)
    }

    // Execute all upserts in batches
    if (ops.length > 0) {
      for (let j = 0; j < ops.length; j += 50) {
        await prisma.$transaction(ops.slice(j, j + 50))
      }
      setPrices = ops.length
      totalPrices += setPrices
      setsWithPrices++
    }

    console.log(`${setPrices} prices`)
    await delay(300)
  }

  console.log(`\nPricing sync done: ${totalPrices} prices across ${setsWithPrices} sets`)
}

// ─── Main ───

async function main() {
  const imagesOnly = process.argv.includes('--images-only')
  const pricesOnly = process.argv.includes('--prices-only')
  const logosOnly = process.argv.includes('--logos-only')
  const syncAll = !imagesOnly && !pricesOnly && !logosOnly

  console.log('TCGdex Sync — Starting...\n')

  // Quick API check
  const test = await tcgdexFetch(`${TCGDEX_BASE}/en/sets?pageSize=1`)
  if (!test) {
    console.error('TCGdex API unreachable. Try again later.')
    process.exit(1)
  }
  console.log('TCGdex API is reachable.\n')

  const force = process.argv.includes('--force')
  if (syncAll || imagesOnly) await syncIntlCards(force)
  if (syncAll || logosOnly) await syncSetLogos()
  if (syncAll || pricesOnly) await syncCardmarketPrices()

  console.log('\n✓ All done!')
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})

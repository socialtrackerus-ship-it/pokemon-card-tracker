/**
 * Sync TCGPlayer prices for all English cards from the Pokemon TCG API.
 *
 * Uses individual card fetches (more reliable than set-level queries which 504).
 * Processes cards in batches and saves progress to DB so it's safe to re-run.
 *
 * Usage:
 *   npx tsx scripts/sync-tcgplayer-prices.ts              # all cards missing prices
 *   npx tsx scripts/sync-tcgplayer-prices.ts --all         # refresh all cards
 *   npx tsx scripts/sync-tcgplayer-prices.ts --set base1   # single set
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const API_BASE = 'https://api.pokemontcg.io/v2'
const headers: Record<string, string> = {}
if (process.env.POKEMON_TCG_API_KEY) {
  headers['X-Api-Key'] = process.env.POKEMON_TCG_API_KEY
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchCardPrice(cardId: string, retries = 4): Promise<any | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${API_BASE}/cards/${cardId}`, {
        headers,
        signal: AbortSignal.timeout(25000),
      })
      if (res.ok) {
        const json = await res.json()
        return json.data
      }
      if (res.status === 429) {
        await delay(10000)
        continue
      }
      if (res.status === 504 || res.status === 503) {
        await delay((i + 1) * 5000)
        continue
      }
      return null // 404 or other non-retryable error
    } catch {
      if (i === retries - 1) return null
      await delay((i + 1) * 3000)
    }
  }
  return null
}

async function upsertPrices(cardId: string, tcgplayer: any): Promise<number> {
  if (!tcgplayer?.prices) return 0
  const ops: any[] = []

  for (const [variant, p] of Object.entries(tcgplayer.prices) as [string, any][]) {
    ops.push(
      prisma.cardPrice.upsert({
        where: { cardId_variant_source: { cardId, variant, source: 'tcgplayer' } },
        create: {
          cardId,
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
  }

  if (ops.length > 0) {
    await prisma.$transaction(ops)
  }
  return ops.length
}

async function main() {
  const refreshAll = process.argv.includes('--all')
  const targetSetId = process.argv.includes('--set')
    ? process.argv[process.argv.indexOf('--set') + 1]
    : null

  // Get card IDs to process
  let cardIds: string[]

  if (targetSetId) {
    const cards = await prisma.card.findMany({
      where: { setId: targetSetId },
      select: { id: true },
      orderBy: { number: 'asc' },
    })
    cardIds = cards.map(c => c.id)
    console.log(`Syncing ${cardIds.length} cards from set ${targetSetId}`)
  } else if (refreshAll) {
    const cards = await prisma.card.findMany({
      where: { set: { language: 'en' } },
      select: { id: true },
      orderBy: [{ setId: 'asc' }, { number: 'asc' }],
    })
    cardIds = cards.map(c => c.id)
    console.log(`Refreshing prices for all ${cardIds.length} English cards`)
  } else {
    // Only cards without any tcgplayer prices
    const cardsWithPrices = await prisma.cardPrice.findMany({
      where: { source: 'tcgplayer' },
      select: { cardId: true },
      distinct: ['cardId'],
    })
    const hasPrice = new Set(cardsWithPrices.map(c => c.cardId))

    const allCards = await prisma.card.findMany({
      where: { set: { language: 'en' } },
      select: { id: true },
      orderBy: [{ setId: 'asc' }, { number: 'asc' }],
    })
    cardIds = allCards.filter(c => !hasPrice.has(c.id)).map(c => c.id)
    console.log(`${allCards.length} English cards total, ${cardIds.length} missing prices`)
  }

  if (cardIds.length === 0) {
    console.log('All cards already have prices!')
    await prisma.$disconnect()
    return
  }

  // Process one card at a time — API is flaky, concurrent requests make it worse
  let totalPrices = 0
  let fetched = 0
  let errors = 0
  let consecutiveErrors = 0

  console.log(`\nFetching prices one at a time (API is flaky)...\n`)

  for (let i = 0; i < cardIds.length; i++) {
    const cardId = cardIds[i]
    const data = await fetchCardPrice(cardId)

    fetched++
    if (data === null) {
      errors++
      consecutiveErrors++
    } else {
      if (data.tcgplayer) {
        const count = await upsertPrices(cardId, data.tcgplayer)
        totalPrices += count
      }
      consecutiveErrors = 0
    }

    // Progress log every 25 cards
    if (fetched % 25 === 0 || i === cardIds.length - 1) {
      const pct = ((fetched / cardIds.length) * 100).toFixed(1)
      process.stdout.write(`\r  ${fetched}/${cardIds.length} cards (${pct}%) — ${totalPrices} prices, ${errors} errors`)
    }

    // Stop if API is completely dead (30 consecutive failures)
    if (consecutiveErrors >= 30) {
      console.log(`\n\n30 consecutive errors — API appears down. Stopping.`)
      console.log(`Re-run to continue from where you left off (${cardIds.length - fetched} remaining).`)
      break
    }

    // Longer delay between requests to be gentle on the API
    await delay(consecutiveErrors > 5 ? 5000 : 1000)
  }

  console.log(`\n\nDone! Fetched ${fetched} cards, ${totalPrices} price records, ${errors} errors`)
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})

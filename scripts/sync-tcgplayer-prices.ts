/**
 * Sync TCGPlayer prices for all English cards from the Pokemon TCG API.
 *
 * This is faster than re-seeding cards because it only fetches and updates prices.
 * Usage: npx tsx scripts/sync-tcgplayer-prices.ts [--set <setId>]
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

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(30000) })
      if (res.ok) return res
      if (res.status === 429 || res.status === 504 || res.status === 503) {
        const waitTime = (i + 1) * 5000
        console.log(`  Retryable error (${res.status}), waiting ${waitTime / 1000}s...`)
        await delay(waitTime)
        continue
      }
      throw new Error(`HTTP ${res.status}`)
    } catch (err: any) {
      if (err.message?.startsWith('HTTP')) throw err
      if (i === retries - 1) throw err
      await delay((i + 1) * 3000)
    }
  }
  throw new Error('Max retries exceeded')
}

async function syncSetPrices(setId: string): Promise<{ updated: number; errors: number }> {
  let updated = 0
  let errors = 0
  let page = 1
  let hasMore = true

  while (hasMore) {
    try {
      const res = await fetchWithRetry(
        `${API_BASE}/cards?q=set.id:${setId}&pageSize=250&page=${page}&select=id,tcgplayer`
      )
      const data = await res.json()

      const ops: any[] = []
      for (const card of data.data) {
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
        }
      }

      if (ops.length > 0) {
        // Batch in groups of 50
        for (let i = 0; i < ops.length; i += 50) {
          await prisma.$transaction(ops.slice(i, i + 50))
        }
        updated += ops.length
      }

      hasMore = (data.data.length + (page - 1) * 250) < data.totalCount
      page++
      if (hasMore) await delay(1500)
    } catch (err: any) {
      console.error(`  Error on page ${page}: ${err.message}`)
      errors++
      break
    }
  }

  return { updated, errors }
}

async function main() {
  // Check API availability with generous timeout
  try {
    const res = await fetchWithRetry(`${API_BASE}/sets?pageSize=1`)
    if (!res.ok) {
      console.error(`Pokemon TCG API unavailable (HTTP ${res.status}). Try again later.`)
      process.exit(1)
    }
  } catch (err: any) {
    console.error(`Pokemon TCG API unreachable: ${err.message}. Try again later.`)
    process.exit(1)
  }

  console.log('Pokemon TCG API is available. Starting price sync...\n')

  // Determine which sets to sync
  const targetSetId = process.argv.includes('--set')
    ? process.argv[process.argv.indexOf('--set') + 1]
    : null

  let sets: { id: string; name: string }[]

  if (targetSetId) {
    const set = await prisma.set.findUnique({ where: { id: targetSetId }, select: { id: true, name: true } })
    if (!set) {
      console.error(`Set ${targetSetId} not found`)
      process.exit(1)
    }
    sets = [set]
  } else {
    // Get all English sets that have cards
    const setsWithCards = await prisma.card.groupBy({ by: ['setId'], _count: true })
    const setIds = setsWithCards.map(s => s.setId)
    sets = await prisma.set.findMany({
      where: { id: { in: setIds }, language: 'en' },
      orderBy: { releaseDate: 'desc' },
      select: { id: true, name: true },
    })
  }

  console.log(`Syncing prices for ${sets.length} sets...\n`)

  let totalUpdated = 0
  let totalErrors = 0

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i]
    process.stdout.write(`[${i + 1}/${sets.length}] ${set.name}... `)

    const { updated, errors } = await syncSetPrices(set.id)
    totalUpdated += updated
    totalErrors += errors

    console.log(`${updated} prices${errors ? `, ${errors} errors` : ''}`)
    await delay(1000)
  }

  console.log(`\nDone! Updated ${totalUpdated} price records, ${totalErrors} errors`)
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})

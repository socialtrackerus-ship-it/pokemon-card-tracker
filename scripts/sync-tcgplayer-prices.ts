/**
 * Sync TCGPlayer prices for all English cards from the Pokemon TCG API.
 *
 * The API is often flaky (504s, timeouts), so this script retries aggressively
 * and continues past failures, resuming where it left off on re-run.
 *
 * Usage:
 *   npx tsx scripts/sync-tcgplayer-prices.ts          # all sets
 *   npx tsx scripts/sync-tcgplayer-prices.ts --set base1  # single set
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

async function fetchWithRetry(url: string, retries = 5): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(60000) })
      if (res.ok) return res
      if (res.status === 429 || res.status === 504 || res.status === 503) {
        const waitTime = (i + 1) * 8000
        console.log(`\n    Retryable ${res.status}, waiting ${waitTime / 1000}s...`)
        await delay(waitTime)
        continue
      }
      throw new Error(`HTTP ${res.status}`)
    } catch (err: any) {
      if (err.message?.startsWith('HTTP')) throw err
      if (i === retries - 1) throw err
      const waitTime = (i + 1) * 5000
      console.log(`\n    ${err.message}, retry ${i + 1}/${retries} in ${waitTime / 1000}s...`)
      await delay(waitTime)
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
        `${API_BASE}/cards?q=set.id:${setId}&pageSize=250&page=${page}`
      )
      const data = await res.json()
      if (!data.data || data.data.length === 0) break

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
        for (let i = 0; i < ops.length; i += 50) {
          await prisma.$transaction(ops.slice(i, i + 50))
        }
        updated += ops.length
      }

      hasMore = data.data.length === 250 && (page * 250) < (data.totalCount || Infinity)
      page++
      if (hasMore) await delay(2000)
    } catch (err: any) {
      errors++
      break
    }
  }

  return { updated, errors }
}

async function main() {
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
    // Get EN sets that have cards, prioritize those missing prices
    const setsWithCards = await prisma.card.groupBy({ by: ['setId'], _count: true })
    const setIds = setsWithCards.map(s => s.setId)

    const allSets = await prisma.set.findMany({
      where: { id: { in: setIds }, language: 'en' },
      orderBy: { releaseDate: 'desc' },
      select: { id: true, name: true },
    })

    // Check which sets are missing prices, put them first
    const withPrices = new Set<string>()
    const priceCheck = await prisma.cardPrice.groupBy({
      by: ['cardId'],
      where: { source: 'tcgplayer' },
      _count: true,
    })
    const cardToSet = new Map(setsWithCards.flatMap(s =>
      Array.from({ length: s._count }, () => [s.setId, s.setId])
    ))
    // Simpler: just check count per set
    for (const s of allSets) {
      const pCount = await prisma.cardPrice.count({
        where: { card: { setId: s.id }, source: 'tcgplayer' },
        take: 1,
      })
      if (pCount > 0) withPrices.add(s.id)
    }

    const noPriceSets = allSets.filter(s => !withPrices.has(s.id))
    const hasPriceSets = allSets.filter(s => withPrices.has(s.id))
    sets = [...noPriceSets, ...hasPriceSets]

    console.log(`${noPriceSets.length} sets missing prices (priority), ${hasPriceSets.length} sets to refresh`)
  }

  console.log(`Syncing prices for ${sets.length} sets...\n`)

  let totalUpdated = 0
  let totalErrors = 0
  let consecutive504s = 0

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i]
    process.stdout.write(`[${i + 1}/${sets.length}] ${set.name}... `)

    const { updated, errors } = await syncSetPrices(set.id)
    totalUpdated += updated
    totalErrors += errors

    if (errors > 0) {
      consecutive504s++
      console.log(`FAILED`)
      if (consecutive504s >= 5) {
        console.log(`\n5 consecutive failures — API appears down. Stopping.`)
        console.log(`Re-run this script later to continue from where it left off.`)
        break
      }
      await delay(10000)
    } else {
      consecutive504s = 0
      console.log(`${updated} prices`)
      await delay(1500)
    }
  }

  console.log(`\nDone! Updated ${totalUpdated} price records, ${totalErrors} errors`)
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})

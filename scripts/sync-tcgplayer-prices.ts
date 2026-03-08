/**
 * Sync TCGPlayer prices for all English cards from the Pokemon TCG API.
 *
 * Uses curl for HTTP requests (more reliable than Node fetch for this API).
 * Processes one set at a time with the select parameter to minimize payload.
 *
 * Usage:
 *   npx tsx scripts/sync-tcgplayer-prices.ts              # all sets missing prices
 *   npx tsx scripts/sync-tcgplayer-prices.ts --all         # refresh all sets
 *   npx tsx scripts/sync-tcgplayer-prices.ts --set base1   # single set
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

const API_BASE = 'https://api.pokemontcg.io/v2'
const apiKey = process.env.POKEMON_TCG_API_KEY

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function curlFetch(url: string): any | null {
  try {
    const headerArg = apiKey ? `-H "X-Api-Key: ${apiKey}"` : ''
    const result = execSync(
      `curl -m 30 -s ${headerArg} "${url}"`,
      { encoding: 'utf-8', timeout: 35000 }
    )
    return JSON.parse(result)
  } catch {
    return null
  }
}

async function syncSetPrices(setId: string): Promise<number> {
  let totalPrices = 0
  let page = 1
  let hasMore = true

  while (hasMore) {
    const url = `${API_BASE}/cards?q=set.id:${setId}&pageSize=250&page=${page}&select=id,tcgplayer`
    const data = curlFetch(url)

    if (!data?.data || data.data.length === 0) break

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
      totalPrices += ops.length
    }

    hasMore = data.data.length === 250
    page++
    if (hasMore) await delay(2000)
  }

  return totalPrices
}

async function main() {
  const refreshAll = process.argv.includes('--all')
  const targetSetId = process.argv.includes('--set')
    ? process.argv[process.argv.indexOf('--set') + 1]
    : null

  // Quick API check
  const testData = curlFetch(`${API_BASE}/sets?pageSize=1`)
  if (!testData) {
    console.error('Pokemon TCG API unreachable. Try again later.')
    process.exit(1)
  }
  console.log('API is reachable. Starting price sync...\n')

  let sets: { id: string; name: string }[]

  if (targetSetId) {
    const set = await prisma.set.findUnique({ where: { id: targetSetId }, select: { id: true, name: true } })
    if (!set) { console.error(`Set ${targetSetId} not found`); process.exit(1) }
    sets = [set]
  } else {
    const allSets = await prisma.set.findMany({
      where: { language: 'en' },
      orderBy: { releaseDate: 'desc' },
      select: { id: true, name: true },
    })

    if (refreshAll) {
      sets = allSets
    } else {
      // Only sets missing prices
      const noPriceSets: typeof allSets = []
      for (const s of allSets) {
        const pCount = await prisma.cardPrice.count({
          where: { card: { setId: s.id }, source: 'tcgplayer' },
          take: 1,
        })
        if (pCount === 0) noPriceSets.push(s)
      }
      sets = noPriceSets
      console.log(`${allSets.length} total EN sets, ${noPriceSets.length} missing prices`)
    }
  }

  console.log(`Syncing ${sets.length} sets...\n`)

  let totalPrices = 0
  let errors = 0
  let consecutiveErrors = 0

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i]
    process.stdout.write(`[${i + 1}/${sets.length}] ${set.name}... `)

    try {
      const count = await syncSetPrices(set.id)
      totalPrices += count
      console.log(`${count} prices`)
      consecutiveErrors = 0
      await delay(1500)
    } catch (err: any) {
      console.log(`FAILED: ${err.message}`)
      errors++
      consecutiveErrors++
      if (consecutiveErrors >= 10) {
        console.log(`\n10 consecutive failures — stopping. Re-run to continue.`)
        break
      }
      await delay(5000)
    }
  }

  console.log(`\nDone! ${totalPrices} price records synced, ${errors} errors`)
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
})

const API_BASE = 'https://api.pokemontcg.io/v2'
const GITHUB_BASE = 'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master'

const headers: Record<string, string> = {}
if (process.env.POKEMON_TCG_API_KEY) {
  headers['X-Api-Key'] = process.env.POKEMON_TCG_API_KEY
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithRetry(url: string, opts: Record<string, any> = {}, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, opts)
      if (res.ok) return res
      if (res.status === 429 || res.status === 504 || res.status === 503) {
        const waitTime = (i + 1) * 5000
        console.log(`    Retryable error (${res.status}), waiting ${waitTime / 1000}s...`)
        await delay(waitTime)
        continue
      }
      throw new Error(`HTTP ${res.status}`)
    } catch (err: any) {
      if (err.message?.startsWith('HTTP')) throw err
      if (i === retries - 1) throw err
      const waitTime = (i + 1) * 3000
      console.log(`    Fetch error: ${err.message}, retrying in ${waitTime / 1000}s...`)
      await delay(waitTime)
    }
  }
  throw new Error('Max retries exceeded')
}

// Check if the Pokemon TCG API is responsive
async function isAPIAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/sets?pageSize=1`, { headers, signal: AbortSignal.timeout(10000) })
    return res.ok
  } catch {
    return false
  }
}

async function fetchCardsFromAPI(setId: string): Promise<any[]> {
  const allCards: any[] = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const res = await fetchWithRetry(
      `${API_BASE}/cards?q=set.id:${setId}&pageSize=250&page=${page}`,
      { headers }
    )
    const data = await res.json()
    allCards.push(...data.data)
    console.log(`    Fetched page ${page} (${allCards.length}/${data.totalCount} cards)`)
    hasMore = allCards.length < data.totalCount
    page++
    if (hasMore) await delay(1500)
  }

  return allCards
}

async function fetchCardsFromGitHub(setId: string): Promise<any[] | null> {
  try {
    const res = await fetch(`${GITHUB_BASE}/cards/en/${setId}.json`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// Batch upsert cards using a transaction
async function upsertCardsBatch(cards: any[], setId: string) {
  const BATCH_SIZE = 25

  for (let i = 0; i < cards.length; i += BATCH_SIZE) {
    const batch = cards.slice(i, i + BATCH_SIZE)
    const ops: any[] = []

    for (const c of batch) {
      ops.push(
        prisma.card.upsert({
          where: { id: c.id },
          create: {
            id: c.id,
            setId,
            name: c.name,
            supertype: c.supertype,
            subtypes: c.subtypes || null,
            hp: c.hp || null,
            types: c.types || null,
            rarity: c.rarity || null,
            imageSmall: c.images?.small || '',
            imageLarge: c.images?.large || '',
            number: c.number,
            artist: c.artist || null,
            tcgplayerUrl: c.tcgplayer?.url || null,
            attacks: c.attacks || null,
            abilities: c.abilities || null,
          },
          update: {
            name: c.name,
            supertype: c.supertype,
            subtypes: c.subtypes || null,
            hp: c.hp || null,
            types: c.types || null,
            rarity: c.rarity || null,
            imageSmall: c.images?.small || '',
            imageLarge: c.images?.large || '',
            artist: c.artist || null,
            tcgplayerUrl: c.tcgplayer?.url || null,
            attacks: c.attacks || null,
            abilities: c.abilities || null,
            syncedAt: new Date(),
          },
        })
      )

      // Upsert prices (only available from API, not GitHub)
      const prices = c.tcgplayer?.prices
      if (prices) {
        for (const [variant, p] of Object.entries(prices) as [string, any][]) {
          ops.push(
            prisma.cardPrice.upsert({
              where: { cardId_variant: { cardId: c.id, variant } },
              create: {
                cardId: c.id,
                variant,
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
    }

    await prisma.$transaction(ops)
    console.log(`    Upserted ${Math.min(i + BATCH_SIZE, cards.length)}/${cards.length} cards`)
  }
}

async function seedCards() {
  const allSets = await prisma.set.findMany({
    orderBy: { releaseDate: 'asc' },
    select: { id: true, name: true, total: true },
  })

  // Check which sets already have cards
  const setsWithCards = await prisma.card.groupBy({
    by: ['setId'],
    _count: true,
  })
  const seededSetMap = new Map(setsWithCards.map(s => [s.setId, s._count]))

  const unseeded = allSets.filter(s => !seededSetMap.has(s.id))
  const partial = allSets.filter(s => {
    const count = seededSetMap.get(s.id) || 0
    return count > 0 && count < s.total
  })

  const toSeed = [...partial, ...unseeded]
  console.log(`${allSets.length} total sets, ${allSets.length - toSeed.length} fully seeded, ${toSeed.length} to seed\n`)

  if (toSeed.length === 0) {
    console.log('All sets already seeded!')
    await prisma.$disconnect()
    return
  }

  // Check which data source to use
  const useAPI = await isAPIAvailable()
  console.log(`Data source: ${useAPI ? 'Pokemon TCG API (with prices)' : 'GitHub repo (no prices)'}\n`)

  let completed = 0
  let skipped = 0
  for (const set of toSeed) {
    console.log(`[${completed + skipped + 1}/${toSeed.length}] ${set.name} (${set.id})`)

    try {
      let cards: any[] | null = null

      if (useAPI) {
        cards = await fetchCardsFromAPI(set.id)
      } else {
        cards = await fetchCardsFromGitHub(set.id)
        if (!cards) {
          console.log(`  Skipped — not available in GitHub data\n`)
          skipped++
          continue
        }
      }

      console.log(`  Found ${cards.length} cards, upserting...`)
      await upsertCardsBatch(cards, set.id)

      completed++
      console.log(`  Done! (${completed} seeded, ${skipped} skipped)\n`)
      if (useAPI) await delay(2000) // Rate limit for API
    } catch (err: any) {
      console.error(`  ERROR: ${err.message}`)
      console.log('  Waiting 15s before continuing...\n')
      await delay(15000)
    }
  }

  console.log('\nSeed complete!')
  const totalCards = await prisma.card.count()
  const totalPrices = await prisma.cardPrice.count()
  console.log(`Total cards: ${totalCards}`)
  console.log(`Total price records: ${totalPrices}`)
  console.log(`Sets seeded: ${completed}, skipped: ${skipped}`)
  await prisma.$disconnect()
}

seedCards().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})

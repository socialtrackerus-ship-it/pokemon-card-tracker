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
        console.log(`  Retryable error (${res.status}), waiting ${waitTime / 1000}s...`)
        await delay(waitTime)
        continue
      }
      throw new Error(`HTTP ${res.status}`)
    } catch (err: any) {
      if (err.message?.startsWith('HTTP')) throw err
      if (i === retries - 1) throw err
      const waitTime = (i + 1) * 3000
      console.log(`  Fetch error: ${err.message}, retrying in ${waitTime / 1000}s...`)
      await delay(waitTime)
    }
  }
  throw new Error('Max retries exceeded')
}

async function fetchSetsFromAPI(): Promise<any[] | null> {
  try {
    console.log('Trying Pokemon TCG API...')
    const res = await fetchWithRetry(`${API_BASE}/sets?orderBy=releaseDate`, { headers })
    const data = await res.json()
    return data.data
  } catch (err: any) {
    console.log(`API unavailable: ${err.message}`)
    return null
  }
}

async function fetchSetsFromGitHub(): Promise<any[]> {
  console.log('Falling back to GitHub data repo...')
  const res = await fetch(`${GITHUB_BASE}/sets/en.json`)
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`)
  const sets = await res.json()
  return sets
}

async function seedSets() {
  let sets = await fetchSetsFromAPI()

  if (!sets) {
    sets = await fetchSetsFromGitHub()
  }

  console.log(`Found ${sets.length} sets. Upserting in batch...`)

  const BATCH_SIZE = 50
  for (let i = 0; i < sets.length; i += BATCH_SIZE) {
    const batch = sets.slice(i, i + BATCH_SIZE)
    await prisma.$transaction(
      batch.map((s: any) =>
        prisma.set.upsert({
          where: { id: s.id },
          create: {
            id: s.id,
            name: s.name,
            series: s.series,
            printedTotal: s.printedTotal,
            total: s.total,
            releaseDate: s.releaseDate || null,
            symbolUrl: s.images?.symbol || null,
            logoUrl: s.images?.logo || null,
            language: 'en',
          },
          update: {
            name: s.name,
            series: s.series,
            printedTotal: s.printedTotal,
            total: s.total,
            releaseDate: s.releaseDate || null,
            symbolUrl: s.images?.symbol || null,
            logoUrl: s.images?.logo || null,
            syncedAt: new Date(),
          },
        })
      )
    )
    console.log(`  Upserted ${Math.min(i + BATCH_SIZE, sets.length)}/${sets.length} sets`)
  }

  console.log(`Done! Upserted ${sets.length} sets.`)
  await prisma.$disconnect()
}

seedSets().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

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
  return await res.json()
}

async function upsertSets(sets: any[], language: string) {
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
            series: s.series || 'Other',
            printedTotal: s.printedTotal || s.printed_total || 0,
            total: s.total || 0,
            releaseDate: s.releaseDate || s.release_date || null,
            symbolUrl: s.images?.symbol || s.symbol_url || null,
            logoUrl: s.images?.logo || s.logo_url || null,
            language,
          },
          update: {
            name: s.name,
            series: s.series || 'Other',
            printedTotal: s.printedTotal || s.printed_total || 0,
            total: s.total || 0,
            releaseDate: s.releaseDate || s.release_date || null,
            symbolUrl: s.images?.symbol || s.symbol_url || null,
            logoUrl: s.images?.logo || s.logo_url || null,
            syncedAt: new Date(),
          },
        })
      )
    )
    console.log(`  Upserted ${Math.min(i + BATCH_SIZE, sets.length)}/${sets.length} sets`)
  }
}

/**
 * Load sets from a local JSON file and prefix IDs to avoid collisions.
 */
function loadLocalSets(filename: string, prefix: string): any[] | null {
  const filePath = path.join(__dirname, 'data', filename)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf-8')
  const sets = JSON.parse(raw)
  // Ensure IDs have the language prefix
  return sets.map((s: any) => ({
    ...s,
    id: s.id.startsWith(`${prefix}-`) ? s.id : `${prefix}-${s.id}`,
  }))
}

const LOCAL_LANGUAGES = [
  { code: 'ja', label: 'Japanese', file: 'japanese-sets.json', prefix: 'ja' },
  { code: 'ko', label: 'Korean', file: 'korean-sets.json', prefix: 'ko' },
  { code: 'zh', label: 'Chinese', file: 'chinese-sets.json', prefix: 'zh' },
]

async function seedSets() {
  // ─── English sets (from API / GitHub) ───
  console.log('=== English Sets ===')
  let enSets = await fetchSetsFromAPI()
  if (!enSets) {
    enSets = await fetchSetsFromGitHub()
  }
  console.log(`Found ${enSets.length} English sets. Upserting...`)
  await upsertSets(enSets, 'en')

  // ─── Non-English sets (from local data files) ───
  for (const { code, label, file, prefix } of LOCAL_LANGUAGES) {
    console.log(`\n=== ${label} Sets ===`)
    const sets = loadLocalSets(file, prefix)
    if (!sets) {
      console.log(`  No data file found at scripts/data/${file}`)
      continue
    }
    console.log(`Found ${sets.length} ${label} sets. Upserting...`)
    await upsertSets(sets, code)
  }

  // ─── Summary ───
  const counts = await prisma.set.groupBy({ by: ['language'], _count: true })
  const total = counts.reduce((sum, c) => sum + c._count, 0)
  console.log(`\nDone! Total sets: ${total}`)
  for (const c of counts) {
    console.log(`  ${c.language.toUpperCase()}: ${c._count}`)
  }
  await prisma.$disconnect()
}

seedSets().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})

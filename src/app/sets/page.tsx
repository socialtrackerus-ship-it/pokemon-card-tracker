import { prisma } from '@/lib/db'
import { SetGrid } from '@/components/sets/set-grid'
import { Pagination } from '@/components/pagination'
import { SetFilter } from '@/components/sets/set-filter'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', label: 'Korean', flag: '🇰🇷' },
  { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
] as const

interface SetsPageProps {
  searchParams: Promise<{ page?: string; series?: string; q?: string; lang?: string }>
}

export default async function SetsPage({ searchParams }: SetsPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const pageSize = 20
  const series = params.series
  const query = params.q
  const lang = params.lang || 'en'

  // Get language counts for tabs
  const langCounts = await prisma.set.groupBy({
    by: ['language'],
    _count: true,
  })
  const langCountMap = new Map(langCounts.map(l => [l.language, l._count]))

  // Get series list filtered by current language
  const seriesListRaw = await prisma.set.findMany({
    where: { language: lang },
    select: { series: true },
    distinct: ['series'],
    orderBy: { series: 'asc' },
  })
  const seriesList = seriesListRaw.map((s) => s.series)

  const where: Record<string, unknown> = { language: lang }
  if (series) where.series = series
  if (query) where.name = { contains: query, mode: 'insensitive' }

  const [setsRaw, count] = await Promise.all([
    prisma.set.findMany({
      where,
      orderBy: { releaseDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.set.count({ where }),
  ])

  const totalPages = Math.ceil(count / pageSize)

  const sets = setsRaw.map((s) => ({
    id: s.id,
    name: s.name,
    series: s.series,
    printed_total: s.printedTotal,
    total: s.total,
    release_date: s.releaseDate || '',
    symbol_url: s.symbolUrl,
    logo_url: s.logoUrl,
    language: s.language,
    synced_at: s.syncedAt.toISOString(),
  }))

  return (
    <div className="animate-in">
      {/* Page header */}
      <div className="container py-8 pb-0">
        <span className="text-eyebrow brand-text">EXPLORE</span>
        <h1 className="text-display-xl mt-1">Card Sets</h1>
        <p className="text-[14px] text-[var(--text-secondary)] mt-2">
          {count} sets across every generation
        </p>
      </div>

      {/* Language tabs */}
      <div className="container mt-5">
        <div className="flex gap-1 border-b border-[var(--border-subtle)]">
          {LANGUAGES.map((l) => {
            const c = langCountMap.get(l.code) || 0
            if (c === 0 && l.code !== 'en') return null
            const active = lang === l.code
            return (
              <Link
                key={l.code}
                href={`/sets?lang=${l.code}`}
                className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors ${
                  active
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                <span className="flex items-center gap-2">
                  {l.label}
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                    active
                      ? 'bg-[var(--brand-subtle)] text-[var(--brand)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-tertiary)]'
                  }`}>
                    {c}
                  </span>
                </span>
                {active && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-[var(--brand)]" />
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-12 z-20 mt-2">
        <div
          className="bg-[var(--surface-0)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]"
          style={{
            borderImage: 'linear-gradient(to right, transparent, var(--border-default), transparent) 1',
          }}
        >
          <div className="container py-3">
            <SetFilter
              seriesList={seriesList}
              currentSeries={series}
              currentQuery={query}
              currentLang={lang}
            />
          </div>
        </div>
      </div>

      {/* Set grid + pagination */}
      <div className="container py-8">
        <SetGrid sets={sets} />
        <Pagination currentPage={page} totalPages={totalPages} />
      </div>
    </div>
  )
}

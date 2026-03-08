import { prisma } from '@/lib/db'
import { SetGrid } from '@/components/sets/set-grid'
import { Pagination } from '@/components/pagination'
import { SetFilter } from '@/components/sets/set-filter'

export const dynamic = 'force-dynamic'

interface SetsPageProps {
  searchParams: Promise<{ page?: string; series?: string; q?: string }>
}

export default async function SetsPage({ searchParams }: SetsPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const pageSize = 20
  const series = params.series
  const query = params.q

  const seriesListRaw = await prisma.set.findMany({
    select: { series: true },
    distinct: ['series'],
    orderBy: { series: 'asc' },
  })
  const seriesList = seriesListRaw.map((s) => s.series)

  const where: Record<string, unknown> = {}
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

      {/* Sticky filter bar */}
      <div className="sticky top-12 z-20 mt-6">
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

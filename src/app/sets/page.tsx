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
  const seriesList = seriesListRaw.map(s => s.series)

  const where: any = {}
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

  const sets = setsRaw.map(s => ({
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
    <div className="container py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-display-lg">Sets</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">{count} sets across every generation</p>
        </div>
      </div>

      <div className="sticky top-12 z-10 bg-[var(--surface-0)] py-3 -mx-5 px-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-[var(--border-subtle)] mb-6">
        <SetFilter seriesList={seriesList} currentSeries={series} currentQuery={query} />
      </div>

      <SetGrid sets={sets} />
      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  )
}

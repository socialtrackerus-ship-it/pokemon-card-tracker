import { prisma } from '@/lib/db'
import { CardGrid } from '@/components/cards/card-grid'
import { Pagination } from '@/components/pagination'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

interface SetDetailPageProps {
  params: Promise<{ setId: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function SetDetailPage({ params, searchParams }: SetDetailPageProps) {
  const { setId } = await params
  const sp = await searchParams
  const page = parseInt(sp.page || '1')
  const pageSize = 24

  const set = await prisma.set.findUnique({ where: { id: setId } })
  if (!set) notFound()

  const [cardsRaw, count] = await Promise.all([
    prisma.card.findMany({
      where: { setId },
      include: { prices: true },
      orderBy: { number: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.card.count({ where: { setId } }),
  ])

  const totalPages = Math.ceil(count / pageSize)

  const cards = cardsRaw.map(c => ({
    id: c.id,
    set_id: c.setId,
    name: c.name,
    supertype: c.supertype,
    subtypes: c.subtypes as string[] | null,
    hp: c.hp,
    types: c.types as string[] | null,
    rarity: c.rarity,
    image_small: c.imageSmall,
    image_large: c.imageLarge,
    number: c.number,
    artist: c.artist,
    tcgplayer_url: c.tcgplayerUrl,
    attacks: c.attacks,
    abilities: c.abilities,
    synced_at: c.syncedAt.toISOString(),
    card_prices: c.prices.map(p => ({
      variant: p.variant,
      market: p.market,
    })),
  }))

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <Link href="/sets" className="inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors mb-4">
        ← All Sets
      </Link>

      {/* Set header */}
      <div className="surface-1 rounded-lg p-5 md:p-6 mb-8">
        <div className="flex flex-col md:flex-row items-start gap-5">
          {set.logoUrl && (
            <div className="relative h-14 w-40 shrink-0">
              <Image src={set.logoUrl} alt={set.name} fill className="object-contain object-left" sizes="160px" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-display-md">{set.name}</h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">{set.series}</p>
          </div>
          <div className="flex gap-6 text-right shrink-0">
            <div>
              <p className="text-label">Cards</p>
              <p className="text-lg font-semibold text-value mt-0.5">{set.printedTotal}</p>
            </div>
            {set.releaseDate && (
              <div>
                <p className="text-label">Released</p>
                <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">{format(new Date(set.releaseDate), 'MMM d, yyyy')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <CardGrid cards={cards} />
      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  )
}

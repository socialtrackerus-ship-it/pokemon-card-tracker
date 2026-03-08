import { prisma } from '@/lib/db'
import { CardGrid } from '@/components/cards/card-grid'
import { Pagination } from '@/components/pagination'
import { Badge } from '@/components/ui/badge'
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
    <div className="container py-10">
      {/* Set header */}
      <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 md:p-8 mb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--holo-purple)]/5 to-transparent pointer-events-none" />
        <div className="relative flex flex-col md:flex-row items-start gap-6">
          {set.logoUrl && (
            <div className="relative h-20 w-48 shrink-0">
              <Image
                src={set.logoUrl}
                alt={set.name}
                fill
                className="object-contain object-left drop-shadow-[0_0_12px_oklch(0.7_0.15_280_/_20%)]"
                sizes="200px"
              />
            </div>
          )}
          <div>
            <Link href="/sets" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              All Sets
            </Link>
            <h1 className="text-3xl font-bold">{set.name}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{set.series}</p>
            <div className="flex items-center gap-3 mt-3">
              <Badge variant="secondary" className="bg-white/5 border-white/10 text-muted-foreground text-xs">
                {set.printedTotal} cards
              </Badge>
              {set.releaseDate && (
                <span className="text-xs text-muted-foreground/60">
                  Released {format(new Date(set.releaseDate), 'MMMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <CardGrid cards={cards} />
      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  )
}

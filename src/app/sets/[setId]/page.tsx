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

  // Fetch card IDs in rarity order using raw SQL, then load full cards
  const cardIdsRaw: { id: string }[] = await prisma.$queryRaw`
    SELECT id FROM cards
    WHERE set_id = ${setId}
    ORDER BY
      CASE rarity
        WHEN 'Hyper Rare' THEN 1
        WHEN 'Mega Hyper Rare' THEN 2
        WHEN 'Special Illustration Rare' THEN 3
        WHEN 'Illustration Rare' THEN 4
        WHEN 'Shiny Ultra Rare' THEN 5
        WHEN 'Ultra Rare' THEN 6
        WHEN 'Rare Secret' THEN 7
        WHEN 'Rare Rainbow' THEN 8
        WHEN 'ACE SPEC Rare' THEN 9
        WHEN 'Rare Shiny GX' THEN 10
        WHEN 'Rare Shining' THEN 11
        WHEN 'Amazing Rare' THEN 12
        WHEN 'Radiant Rare' THEN 13
        WHEN 'LEGEND' THEN 14
        WHEN 'Rare Ultra' THEN 15
        WHEN 'Rare Holo VSTAR' THEN 16
        WHEN 'Rare Holo VMAX' THEN 17
        WHEN 'Rare Holo V' THEN 18
        WHEN 'Rare Holo GX' THEN 19
        WHEN 'Rare Holo EX' THEN 20
        WHEN 'Rare Holo LV.X' THEN 21
        WHEN 'MEGA_ATTACK_RARE' THEN 22
        WHEN 'Shiny Rare' THEN 23
        WHEN 'Double Rare' THEN 24
        WHEN 'Rare Shiny' THEN 25
        WHEN 'Rare Prime' THEN 26
        WHEN 'Rare Holo Star' THEN 27
        WHEN 'Rare BREAK' THEN 28
        WHEN 'Rare Prism Star' THEN 29
        WHEN 'Rare ACE' THEN 30
        WHEN 'Classic Collection' THEN 31
        WHEN 'Trainer Gallery Rare Holo' THEN 32
        WHEN 'Black White Rare' THEN 33
        WHEN 'Rare Holo' THEN 34
        WHEN 'Rare' THEN 35
        WHEN 'Promo' THEN 36
        WHEN 'Uncommon' THEN 37
        WHEN 'Common' THEN 38
        ELSE 39
      END,
      number ASC
    OFFSET ${(page - 1) * pageSize}
    LIMIT ${pageSize}
  `
  const pageCardIds = cardIdsRaw.map(r => r.id)

  const [cardsRaw, count, chaseCards, sealedProducts] = await Promise.all([
    prisma.card.findMany({
      where: { id: { in: pageCardIds } },
      include: { prices: { where: { source: 'tcgplayer' } } },
    }),
    prisma.card.count({ where: { setId } }),
    prisma.cardPrice.findMany({
      where: { card: { setId }, source: 'tcgplayer', market: { not: null } },
      orderBy: { market: 'desc' },
      take: 3,
      include: { card: true },
    }),
    prisma.sealedProduct.findMany({
      where: { setId },
      orderBy: { productType: 'asc' },
    }),
  ])

  const totalPages = Math.ceil(count / pageSize)

  // Preserve rarity sort order from raw query
  const cardMap = new Map(cardsRaw.map(c => [c.id, c]))
  const cardsSorted = pageCardIds.map(id => cardMap.get(id)!).filter(Boolean)

  const cards = cardsSorted.map((c) => ({
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
    card_prices: c.prices.map((p) => ({
      variant: p.variant,
      market: p.market,
    })),
  }))

  const releaseFormatted = set.releaseDate
    ? format(new Date(set.releaseDate), 'MMMM d, yyyy')
    : null

  return (
    <div className="animate-in">
      {/* Breadcrumb */}
      <div className="container pt-6 pb-0">
        <Link
          href="/sets"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-tertiary)] hover:text-[var(--brand)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          All Sets
        </Link>
      </div>

      {/* Set Hero Header */}
      <div className="section-elevated mt-4">
        <div className="container py-8 md:py-10">
          <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
            {/* Logo */}
            <div className="shrink-0">
              {set.logoUrl ? (
                <div className="relative h-16 w-52 md:h-20 md:w-60">
                  <Image
                    src={set.logoUrl}
                    alt={set.name}
                    fill
                    className="object-contain object-left"
                    sizes="240px"
                    priority
                  />
                </div>
              ) : (
                <h1 className="text-display-xl">{set.name}</h1>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {set.logoUrl && (
                <h1 className="text-display-xl leading-tight">{set.name}</h1>
              )}
              <p className="text-[14px] text-[var(--text-secondary)] mt-1">
                {set.series}
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap gap-3 mt-5">
                <div className="metric-card px-4 py-3 rounded-lg">
                  <span className="text-label block">Total Cards</span>
                  <span className="text-metric-sm mt-0.5 block">{set.printedTotal}</span>
                </div>
                {releaseFormatted && (
                  <div className="metric-card px-4 py-3 rounded-lg">
                    <span className="text-label block">Release Date</span>
                    <span className="text-metric-sm mt-0.5 block">{releaseFormatted}</span>
                  </div>
                )}
                <div className="metric-card px-4 py-3 rounded-lg">
                  <span className="text-label block">Language</span>
                  <span className="text-metric-sm mt-0.5 block capitalize">{set.language}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sealed Product Prices */}
          {sealedProducts.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[var(--border-subtle)]">
              <h3 className="text-eyebrow mb-4">SEALED PRODUCTS</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {sealedProducts.map((sp) => {
                  const label = sp.productType
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (c: string) => c.toUpperCase())
                  return (
                    <div key={sp.id} className="metric-card px-4 py-3 rounded-lg">
                      <span className="text-label block">{label}</span>
                      {sp.market ? (
                        <span className="text-metric-sm gold-text mt-1 block">
                          ${sp.market.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-[12px] text-[var(--text-tertiary)] mt-1 block">
                          No data
                        </span>
                      )}
                      {sp.low && sp.high && (
                        <span className="text-[10px] text-[var(--text-tertiary)] mt-0.5 block">
                          ${sp.low.toFixed(2)} &ndash; ${sp.high.toFixed(2)}
                        </span>
                      )}
                      <span className="text-[9px] text-[var(--text-tertiary)] mt-0.5 block uppercase">
                        {sp.source}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Chase Cards */}
          {chaseCards.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[var(--border-subtle)]">
              <h3 className="text-eyebrow gold-text mb-4">CHASE CARDS</h3>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {chaseCards.map((cp) => (
                  <Link
                    key={cp.card.id}
                    href={`/cards/${cp.card.id}`}
                    className="group shrink-0"
                  >
                    <div className="surface-interactive rounded-lg p-2 hover-lift transition-all">
                      <div className="relative w-20 h-28 rounded overflow-hidden">
                        <Image
                          src={cp.card.imageSmall}
                          alt={cp.card.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                      <div className="mt-1.5 text-center">
                        <p className="text-[10px] font-medium text-[var(--text-primary)] truncate max-w-[80px]">
                          {cp.card.name}
                        </p>
                        {cp.market && (
                          <p className="text-[11px] font-semibold gold-text mt-0.5">
                            ${cp.market.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Explorer */}
      <div className="container py-8">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[13px] text-[var(--text-secondary)]">
            Showing{' '}
            <span className="font-semibold text-[var(--text-primary)]">
              {Math.min((page - 1) * pageSize + 1, count)}
              &ndash;
              {Math.min(page * pageSize, count)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-[var(--text-primary)]">{count}</span>{' '}
            cards
          </p>
        </div>

        <CardGrid cards={cards} />
        <Pagination currentPage={page} totalPages={totalPages} />
      </div>
    </div>
  )
}

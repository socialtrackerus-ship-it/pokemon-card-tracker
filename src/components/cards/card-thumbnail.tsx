import Image from 'next/image'
import Link from 'next/link'

interface CardThumbnailProps {
  card: {
    id: string
    name: string
    image_small: string
    rarity?: string | null
    card_prices?: { market: number | null; variant: string; source?: string }[]
  }
}

function getRarityClass(rarity: string | null | undefined): string {
  if (!rarity) return ''
  const r = rarity.toLowerCase()
  if (r.includes('secret') || r.includes('hyper')) return 'rarity-secret'
  if (r.includes('ultra') || r.includes('illustration') || r.includes('alt')) return 'rarity-ultra'
  if (r.includes('holo') && r.includes('rare')) return 'rarity-holo'
  if (r.includes('rare')) return 'rarity-rare'
  if (r.includes('uncommon')) return 'rarity-uncommon'
  return 'rarity-common'
}

export function CardThumbnail({ card }: CardThumbnailProps) {
  // Prefer TCGPlayer price, fall back to Cardmarket
  const tcgPrice = card.card_prices?.find(
    (p) => (p.variant === 'holofoil' || p.variant === 'normal') && p.source !== 'cardmarket'
  )
  const cmPrice = card.card_prices?.find(
    (p) => p.source === 'cardmarket' && p.market != null
  )
  const mainPrice = tcgPrice || cmPrice
  const marketPrice = mainPrice?.market
  const isEur = mainPrice === cmPrice && !tcgPrice
  const rarityClass = getRarityClass(card.rarity)

  return (
    <Link href={`/cards/${card.id}`} className="group stagger">
      <div className="card-frame hover-lift">
        {/* Image Area */}
        <div className="relative aspect-[245/342] overflow-hidden rounded-t-[inherit]">
          {card.image_small ? (
            <div className="zoom-container w-full h-full">
              <Image
                src={card.image_small}
                alt={card.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--surface-2)]">
              <div className="text-center px-3">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-[var(--text-tertiary)]">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-1.5 leading-tight">{card.name}</p>
              </div>
            </div>
          )}

          {/* Price Overlay */}
          {marketPrice != null && marketPrice > 0 && (
            <div
              className="absolute bottom-2 right-2 gold-text text-[11px] font-semibold px-2 py-0.5 rounded-md"
              style={{
                background: 'oklch(0.13 0.005 250 / 85%)',
                backdropFilter: 'blur(8px)',
                border: '1px solid oklch(0.75 0.15 85 / 20%)',
              }}
            >
              {isEur ? '€' : '$'}{marketPrice.toFixed(2)}
            </div>
          )}
        </div>

        {/* Card Info */}
        <div className="px-2.5 py-2">
          <p className="text-[13px] font-medium truncate text-[var(--text-primary)] leading-tight">
            {card.name}
          </p>
          {card.rarity && (
            <p className={`text-[10px] mt-0.5 font-medium ${rarityClass}`}>
              {card.rarity}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

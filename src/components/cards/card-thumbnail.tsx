import Image from 'next/image'
import Link from 'next/link'

interface CardThumbnailProps {
  card: { id: string; name: string; image_small: string; rarity?: string | null; card_prices?: { market: number | null; variant: string }[] }
}

export function CardThumbnail({ card }: CardThumbnailProps) {
  const mainPrice = card.card_prices?.find(p => p.variant === 'normal' || p.variant === 'holofoil')
  const marketPrice = mainPrice?.market

  return (
    <Link href={`/cards/${card.id}`} className="group">
      <div className="surface-interactive rounded-lg overflow-hidden transition-all">
        <div className="relative aspect-[245/342] bg-[var(--surface-2)]">
          <Image src={card.image_small} alt={card.name} fill className="object-cover transition-transform duration-200 group-hover:scale-[1.02]" sizes="200px" loading="lazy" />
          {marketPrice && (
            <div className="absolute bottom-1.5 right-1.5 bg-[var(--surface-0)]/90 backdrop-blur-sm text-[11px] font-semibold text-value gold-text px-1.5 py-0.5 rounded">
              ${marketPrice.toFixed(2)}
            </div>
          )}
        </div>
        <div className="p-2">
          <p className="text-[12px] font-medium truncate">{card.name}</p>
          {card.rarity && <p className="text-[10px] text-[var(--text-tertiary)]">{card.rarity}</p>}
        </div>
      </div>
    </Link>
  )
}

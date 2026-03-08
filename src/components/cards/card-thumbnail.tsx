import Image from 'next/image'
import Link from 'next/link'

interface CardThumbnailProps {
  card: {
    id: string
    name: string
    image_small: string
    rarity?: string | null
    card_prices?: { market: number | null; variant: string }[]
  }
}

export function CardThumbnail({ card }: CardThumbnailProps) {
  const mainPrice = card.card_prices?.find(p => p.variant === 'normal' || p.variant === 'holofoil')
  const marketPrice = mainPrice?.market

  return (
    <Link href={`/cards/${card.id}`} className="group">
      <div className="relative overflow-hidden rounded-xl transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_8px_40px_oklch(0.6_0.2_280_/_15%)]">
        {/* Holographic shine overlay */}
        <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-[var(--holo-purple)]/10 via-transparent to-[var(--holo-cyan)]/10" />
        <div className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </div>

        <Image
          src={card.image_small}
          alt={card.name}
          width={245}
          height={342}
          className="w-full h-auto"
          loading="lazy"
        />

        {marketPrice && (
          <div className="absolute bottom-2 right-2 z-20 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-white/10 shadow-lg">
            ${marketPrice.toFixed(2)}
          </div>
        )}
      </div>
      <div className="mt-2.5 px-0.5">
        <p className="text-sm font-medium truncate group-hover:text-gradient transition-all">{card.name}</p>
        {card.rarity && (
          <p className="text-[11px] text-muted-foreground/60">{card.rarity}</p>
        )}
      </div>
    </Link>
  )
}

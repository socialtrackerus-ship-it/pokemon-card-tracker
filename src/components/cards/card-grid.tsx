import { CardThumbnail } from './card-thumbnail'

interface CardGridProps {
  cards: {
    id: string
    name: string
    image_small: string
    rarity?: string | null
    card_prices?: { market: number | null; variant: string }[]
  }[]
}

export function CardGrid({ cards }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.02]">
        <p className="text-muted-foreground">No cards found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 stagger-children">
      {cards.map((card) => (
        <CardThumbnail key={card.id} card={card} />
      ))}
    </div>
  )
}

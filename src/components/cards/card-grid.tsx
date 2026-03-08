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
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect x="6" y="4" width="20" height="28" rx="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            <rect x="14" y="8" width="20" height="28" rx="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          </svg>
        </div>
        <p className="text-[14px] font-medium text-[var(--text-secondary)] mt-4">No cards found</p>
        <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
          Try adjusting your search or filters to find what you&apos;re looking for.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 stagger">
      {cards.map((card) => (
        <CardThumbnail key={card.id} card={card} />
      ))}
    </div>
  )
}

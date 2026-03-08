import { SetCard } from './set-card'
import { Set } from '@/types/database'

interface SetGridProps {
  sets: Set[]
}

export function SetGrid({ sets }: SetGridProps) {
  if (sets.length === 0) {
    return (
      <div className="empty-state py-20">
        <div className="empty-state-icon mb-4">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-tertiary)]">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
          </svg>
        </div>
        <p className="text-[14px] font-semibold text-[var(--text-secondary)] mb-1">
          No sets found
        </p>
        <p className="text-[12px] text-[var(--text-tertiary)]">
          Try adjusting your search or filter criteria.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 stagger">
      {sets.map((set) => (
        <SetCard key={set.id} set={set} />
      ))}
    </div>
  )
}

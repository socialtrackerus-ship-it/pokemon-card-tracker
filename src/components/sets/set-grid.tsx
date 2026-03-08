import { SetCard } from './set-card'
import { Set } from '@/types/database'

interface SetGridProps { sets: Set[] }

export function SetGrid({ sets }: SetGridProps) {
  if (sets.length === 0) {
    return (
      <div className="surface-1 rounded-lg py-16 text-center">
        <p className="text-[13px] text-[var(--text-secondary)]">No sets found.</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 stagger">
      {sets.map((set) => <SetCard key={set.id} set={set} />)}
    </div>
  )
}

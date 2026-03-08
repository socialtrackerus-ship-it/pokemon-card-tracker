import { SetCard } from './set-card'
import { Set } from '@/types/database'

interface SetGridProps {
  sets: Set[]
}

export function SetGrid({ sets }: SetGridProps) {
  if (sets.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.02]">
        <p className="text-muted-foreground">No sets found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 stagger-children">
      {sets.map((set) => (
        <SetCard key={set.id} set={set} />
      ))}
    </div>
  )
}

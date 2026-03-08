import Image from 'next/image'
import Link from 'next/link'
import { Set } from '@/types/database'
import { format } from 'date-fns'

interface SetCardProps {
  set: Set
}

export function SetCard({ set }: SetCardProps) {
  const releaseLabel = set.release_date
    ? format(new Date(set.release_date), 'MMM yyyy')
    : null

  return (
    <Link href={`/sets/${set.id}`} className="group block">
      <div className="surface-interactive rounded-xl hover-lift h-full flex flex-col overflow-hidden" style={{ minHeight: '200px' }}>
        {/* Logo area with subtle gradient background */}
        <div className="relative flex items-center justify-center px-4 py-6 bg-gradient-to-b from-[var(--surface-2)] to-[var(--surface-1)]">
          {set.logo_url ? (
            <div className="relative h-12 w-full">
              <Image
                src={set.logo_url}
                alt={set.name}
                fill
                className="object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                sizes="200px"
              />
            </div>
          ) : (
            <div className="h-12 flex items-center justify-center">
              <span className="text-[15px] font-display font-semibold text-[var(--text-secondary)]">
                {set.name}
              </span>
            </div>
          )}
        </div>

        {/* Info area */}
        <div className="flex-1 flex flex-col px-3.5 py-3 border-t border-[var(--border-subtle)]">
          <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">
            {set.name}
          </p>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 truncate">
            {set.series}
          </p>

          {/* Bottom metadata row */}
          <div className="flex items-center justify-between mt-auto pt-2.5">
            <span className="text-label text-[var(--text-tertiary)]">
              {set.printed_total} cards
            </span>
            {releaseLabel && (
              <span className="text-label text-[var(--text-tertiary)]">
                {releaseLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

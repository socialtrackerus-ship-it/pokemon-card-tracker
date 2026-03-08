import Image from 'next/image'
import Link from 'next/link'
import { Set } from '@/types/database'
import { format } from 'date-fns'

interface SetCardProps { set: Set }

export function SetCard({ set }: SetCardProps) {
  return (
    <Link href={`/sets/${set.id}`}>
      <div className="surface-interactive rounded-lg p-3 h-full transition-all cursor-pointer">
        {set.logo_url && (
          <div className="relative h-10 w-full mb-2">
            <Image src={set.logo_url} alt={set.name} fill className="object-contain" sizes="180px" />
          </div>
        )}
        <p className="text-[12px] font-medium truncate">{set.name}</p>
        <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{set.series}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-[var(--text-tertiary)]">{set.printed_total} cards</span>
          {set.release_date && (
            <span className="text-[10px] text-[var(--text-tertiary)]">{format(new Date(set.release_date), 'MMM yyyy')}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

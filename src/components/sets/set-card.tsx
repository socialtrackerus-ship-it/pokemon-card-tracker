import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Set } from '@/types/database'
import { format } from 'date-fns'

interface SetCardProps {
  set: Set
}

export function SetCard({ set }: SetCardProps) {
  return (
    <Link href={`/sets/${set.id}`}>
      <div className="group relative rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 cursor-pointer h-full holo-card overflow-hidden">
        <div className="p-4 flex flex-col items-center gap-3">
          {set.logo_url && (
            <div className="relative h-14 w-full opacity-80 group-hover:opacity-100 transition-opacity">
              <Image
                src={set.logo_url}
                alt={set.name}
                fill
                className="object-contain drop-shadow-[0_0_8px_oklch(0.7_0.15_280_/_15%)]"
                sizes="200px"
              />
            </div>
          )}
          <div className="text-center w-full">
            <h3 className="font-semibold text-sm truncate group-hover:text-gradient transition-all">{set.name}</h3>
            <p className="text-xs text-muted-foreground/60 mt-0.5">{set.series}</p>
            <div className="flex items-center justify-center gap-2 mt-2.5">
              <Badge variant="secondary" className="text-[10px] bg-white/5 border-white/10 text-muted-foreground">
                {set.printed_total} cards
              </Badge>
              {set.release_date && (
                <span className="text-[10px] text-muted-foreground/50">
                  {format(new Date(set.release_date), 'MMM yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

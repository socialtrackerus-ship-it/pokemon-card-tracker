import { prisma } from '@/lib/db'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function TrendingPage() {
  const expensiveCards = await prisma.cardPrice.findMany({
    where: { market: { not: null } },
    orderBy: { market: 'desc' },
    take: 20,
    include: { card: { include: { set: { select: { name: true } } } } },
  })

  const recentCards = await prisma.cardPrice.findMany({
    where: { market: { not: null } },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    include: { card: { include: { set: { select: { name: true } } } } },
  })

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-display-lg">Market</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Most valuable cards and recent price movements</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <MarketTable title="Most Valuable" items={expensiveCards} showGold />
        <MarketTable title="Recently Updated" items={recentCards} />
      </div>
    </div>
  )
}

function MarketTable({ title, items, showGold = false }: { title: string; items: any[]; showGold?: boolean }) {
  return (
    <div className="surface-1 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
        <p className="text-[13px] font-semibold">{title}</p>
      </div>
      <div className="overflow-y-auto max-h-[600px]">
        <table className="w-full table-premium">
          <thead>
            <tr>
              <th className="w-10 px-3 py-2.5"></th>
              <th className="text-left px-3 py-2.5">Card</th>
              <th className="text-left px-3 py-2.5 hidden sm:table-cell">Set</th>
              <th className="text-right px-3 py-2.5">Market</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={`${item.cardId}-${item.variant}-${i}`}>
                <td className="px-3 py-2">
                  <Image src={item.card.imageSmall} alt={item.card.name} width={28} height={39} className="rounded-sm" />
                </td>
                <td className="px-3 py-2">
                  <Link href={`/cards/${item.cardId}`} className="text-[12px] font-medium hover:text-[var(--brand)] transition-colors">
                    {item.card.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.card.rarity && <span className="text-[10px] text-[var(--text-tertiary)]">{item.card.rarity}</span>}
                    <span className="text-[10px] text-[var(--text-tertiary)] capitalize">{item.variant}</span>
                  </div>
                </td>
                <td className="px-3 py-2 hidden sm:table-cell text-[11px] text-[var(--text-tertiary)]">{item.card.set.name}</td>
                <td className={`px-3 py-2 text-right text-[12px] font-semibold text-value ${showGold ? 'gold-text' : ''}`}>
                  ${item.market!.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

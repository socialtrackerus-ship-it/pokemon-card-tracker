import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const collection = await prisma.userCollection.findMany({
    where: { userId: session.user.id },
    include: {
      card: {
        include: { prices: { where: { source: 'tcgplayer' } } },
      },
    },
  })

  let totalValue = 0
  let cardCount = 0

  for (const item of collection) {
    cardCount += item.quantity
    const price = item.card.prices.find(p => p.variant === item.variant)
    if (price?.market) {
      totalValue += price.market * item.quantity
    }
  }

  return NextResponse.json({ totalValue, cardCount })
}

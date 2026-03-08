import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await prisma.userCollection.findMany({
    where: { userId: session.user.id },
    include: {
      card: {
        include: {
          prices: { where: { source: 'tcgplayer' } },
          set: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Map to match expected shape in frontend
  const mapped = data.map(item => ({
    ...item,
    cards: {
      id: item.card.id,
      name: item.card.name,
      image_small: item.card.imageSmall,
      rarity: item.card.rarity,
      number: item.card.number,
      sets: { id: item.card.set.id, name: item.card.set.name },
      card_prices: item.card.prices.map(p => ({
        variant: p.variant,
        market: p.market,
      })),
    },
  }))

  return NextResponse.json(mapped)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { card_id, quantity = 1, condition = 'Near Mint', variant = 'normal', purchase_price, notes } = body

  if (!card_id) {
    return NextResponse.json({ error: 'card_id is required' }, { status: 400 })
  }

  const data = await prisma.userCollection.create({
    data: {
      userId: session.user.id,
      cardId: card_id,
      quantity,
      condition,
      variant,
      purchasePrice: purchase_price || null,
      notes: notes || null,
    },
  })

  return NextResponse.json(data, { status: 201 })
}

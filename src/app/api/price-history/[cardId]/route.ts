import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params
  const searchParams = request.nextUrl.searchParams
  const days = parseInt(searchParams.get('days') || '90')
  const variant = searchParams.get('variant') || 'normal'

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const data = await prisma.priceHistory.findMany({
    where: {
      cardId,
      variant,
      recordedDate: { gte: startDate },
    },
    orderBy: { recordedDate: 'asc' },
  })

  return NextResponse.json(data.map(d => ({
    ...d,
    recorded_date: d.recordedDate.toISOString().split('T')[0],
    market_price: d.marketPrice,
  })))
}

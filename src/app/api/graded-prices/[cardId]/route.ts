import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params

  const data = await prisma.gradedPrice.findMany({
    where: { cardId },
    orderBy: [{ gradingCompany: 'asc' }, { grade: 'desc' }],
  })

  return NextResponse.json(data.map(d => ({
    ...d,
    grading_company: d.gradingCompany,
    last_sold_date: d.lastSoldDate,
  })))
}

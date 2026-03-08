import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const q = searchParams.get('q')
  const setId = searchParams.get('set')
  const rarity = searchParams.get('rarity')
  const supertype = searchParams.get('supertype')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  const where: any = {}
  if (q) where.name = { contains: q, mode: 'insensitive' }
  if (setId) where.setId = setId
  if (rarity) where.rarity = rarity
  if (supertype) where.supertype = supertype

  const [data, total] = await Promise.all([
    prisma.card.findMany({
      where,
      include: { prices: true },
      orderBy: { number: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.card.count({ where }),
  ])

  return NextResponse.json({ data, total, page, pageSize })
}

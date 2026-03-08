import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const series = searchParams.get('series')
  const lang = searchParams.get('lang')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')

  const where: any = {}
  if (series) where.series = series
  if (lang) where.language = lang

  const [data, total] = await Promise.all([
    prisma.set.findMany({
      where,
      orderBy: { releaseDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.set.count({ where }),
  ])

  return NextResponse.json({ data, total, page, pageSize })
}

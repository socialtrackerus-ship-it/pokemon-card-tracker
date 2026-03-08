'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { format } from 'date-fns'

interface PriceChartProps {
  cardId: string
  variant?: string
}

interface PricePoint {
  recorded_date: string
  market_price: number
}

export function PriceChart({ cardId, variant = 'normal' }: PriceChartProps) {
  const [data, setData] = useState<PricePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(90)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await fetch(`/api/price-history/${cardId}?days=${days}&variant=${variant}`)
      if (res.ok) {
        setData(await res.json())
      }
      setLoading(false)
    }
    load()
  }, [cardId, variant, days])

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />
  }

  if (data.length === 0) {
    return (
      <Card className="border-white/5 bg-white/[0.02] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Price History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No price history data available yet.</p>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((d) => ({
    date: format(new Date(d.recorded_date), 'MMM d'),
    price: Number(d.market_price),
  }))

  return (
    <Card className="border-white/5 bg-white/[0.02] rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Price History</CardTitle>
        <div className="flex gap-1 p-1 rounded-lg bg-white/5">
          {[30, 90, 365].map((d) => (
            <button
              key={d}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                days === d
                  ? 'bg-gradient-to-r from-[var(--holo-purple)] to-[var(--holo-blue)] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setDays(d)}
            >
              {d === 365 ? '1Y' : `${d}D`}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.7 0.18 280)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="oklch(0.7 0.18 280)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(1 0 0 / 5%)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'oklch(0.5 0.02 270)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'oklch(0.5 0.02 270)' }}
              tickFormatter={(value) => `$${value}`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: 'oklch(0.12 0.015 270 / 90%)',
                border: '1px solid oklch(1 0 0 / 10%)',
                borderRadius: '12px',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px oklch(0 0 0 / 30%)',
              }}
              labelStyle={{ color: 'oklch(0.6 0.02 270)', fontSize: 11 }}
              itemStyle={{ color: 'oklch(0.95 0 0)' }}
              formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Market Price']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="oklch(0.7 0.18 280)"
              strokeWidth={2}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: 'oklch(0.7 0.18 280)',
                stroke: 'oklch(0.12 0.015 270)',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

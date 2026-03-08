'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

interface ChartDataPoint {
  date: string
  price: number
}

const TIME_RANGES = [
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
] as const

export function PriceChart({ cardId, variant = 'normal' }: PriceChartProps) {
  const [data, setData] = useState<PricePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(90)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/price-history/${cardId}?days=${days}&variant=${variant}`)
      if (res.ok) {
        setData(await res.json())
      }
    } catch {
      // silently fail
    }
    setLoading(false)
  }, [cardId, variant, days])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return <div className="skeleton rounded-lg" style={{ height: 340 }} />
  }

  if (data.length === 0) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h3 className="text-[14px] font-semibold tracking-tight">Price History</h3>
        </div>
        <div className="panel-body">
          <div className="flex flex-col items-center justify-center py-10">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-[var(--text-tertiary)] mb-3 opacity-40">
              <path d="M4 24L12 16L18 20L28 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 8H28V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-[12px] text-[var(--text-tertiary)]">
              No price history available yet. Data will appear as prices are tracked over time.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const chartData: ChartDataPoint[] = data.map((d) => ({
    date: format(new Date(d.recorded_date), 'MMM d'),
    price: Number(d.market_price),
  }))

  const minPrice = Math.min(...chartData.map((d) => d.price))
  const maxPrice = Math.max(...chartData.map((d) => d.price))
  const priceChange = chartData.length >= 2 ? chartData[chartData.length - 1].price - chartData[0].price : 0
  const isPositive = priceChange >= 0

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <h3 className="text-[14px] font-semibold tracking-tight">Price History</h3>
            {chartData.length >= 2 && (
              <span className={`text-[12px] font-semibold ${isPositive ? 'gain-text' : 'loss-text'}`}>
                {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({((priceChange / chartData[0].price) * 100).toFixed(1)}%)
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range.days}
                onClick={() => setDays(range.days)}
                className={`${days === range.days ? 'chip-active' : 'chip'} text-[11px] px-2.5 py-1 cursor-pointer`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="panel-body-flush">
        <div className="px-4 pt-4 pb-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id={`priceGrad-${cardId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.65 0.18 240)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="oklch(0.65 0.18 240)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(1 0 0 / 4%)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'oklch(0.45 0.01 250)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'oklch(0.45 0.01 250)' }}
                tickFormatter={(v: number) => `$${v}`}
                axisLine={false}
                tickLine={false}
                domain={[Math.floor(minPrice * 0.95), Math.ceil(maxPrice * 1.05)]}
              />
              <Tooltip
                contentStyle={{
                  background: 'oklch(0.15 0.005 250)',
                  border: '1px solid oklch(1 0 0 / 10%)',
                  borderRadius: '8px',
                  fontSize: 12,
                  padding: '8px 12px',
                  boxShadow: '0 8px 24px oklch(0 0 0 / 40%)',
                }}
                labelStyle={{ color: 'oklch(0.55 0.01 250)', fontSize: 10, marginBottom: 4 }}
                formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Market']}
                cursor={{ stroke: 'oklch(1 0 0 / 8%)', strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="oklch(0.65 0.18 240)"
                strokeWidth={2}
                fill={`url(#priceGrad-${cardId})`}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: 'oklch(0.65 0.18 240)',
                  stroke: 'oklch(0.15 0.005 250)',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

interface PriceChartProps { cardId: string; variant?: string }
interface PricePoint { recorded_date: string; market_price: number }

export function PriceChart({ cardId, variant = 'normal' }: PriceChartProps) {
  const [data, setData] = useState<PricePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(90)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await fetch(`/api/price-history/${cardId}?days=${days}&variant=${variant}`)
      if (res.ok) setData(await res.json())
      setLoading(false)
    }
    load()
  }, [cardId, variant, days])

  if (loading) return <div className="h-64 skeleton rounded-lg" />

  if (data.length === 0) {
    return (
      <div className="surface-1 rounded-lg p-6">
        <p className="text-[13px] font-semibold mb-2">Price History</p>
        <p className="text-[12px] text-[var(--text-tertiary)]">No price data available yet.</p>
      </div>
    )
  }

  const chartData = data.map((d) => ({ date: format(new Date(d.recorded_date), 'MMM d'), price: Number(d.market_price) }))

  return (
    <div className="surface-1 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <p className="text-[13px] font-semibold">Price History</p>
        <div className="flex gap-1">
          {[30, 90, 365].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${days === d ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}>
              {d === 365 ? '1Y' : `${d}D`}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.65 0.18 240)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="oklch(0.65 0.18 240)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 4%)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'oklch(0.45 0.01 250)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'oklch(0.45 0.01 250)' }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: 'oklch(0.14 0.005 250)', border: '1px solid oklch(1 0 0 / 8%)', borderRadius: '6px', fontSize: 12 }}
              labelStyle={{ color: 'oklch(0.55 0.01 250)', fontSize: 10 }}
              formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Market']}
            />
            <Area type="monotone" dataKey="price" stroke="oklch(0.65 0.18 240)" strokeWidth={1.5} fill="url(#priceGrad)" dot={false}
              activeDot={{ r: 3, fill: 'oklch(0.65 0.18 240)', stroke: 'oklch(0.14 0.005 250)', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

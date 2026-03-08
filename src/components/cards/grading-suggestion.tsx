'use client'

import { GRADING_COSTS, getGradingRecommendation } from '@/lib/pricing/grading'

interface GradedPrice { grading_company: string; grade: string; price: number | null }
interface GradingSuggestionProps { rawPrice: number | null; gradedPrices: GradedPrice[] }

export function GradingSuggestion({ rawPrice, gradedPrices }: GradingSuggestionProps) {
  if (!rawPrice || gradedPrices.length === 0) return null

  const recs = gradedPrices.filter(gp => gp.price).map(gp => getGradingRecommendation(rawPrice, gp.price, gp.grading_company, gp.grade))
  if (recs.length === 0) return null

  const best = recs.reduce((b, r) => ((r.potentialProfit || 0) > (b.potentialProfit || 0) ? r : b))

  return (
    <div className="surface-1 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <p className="text-[13px] font-semibold">Grading Intelligence</p>
        {best.shouldGrade
          ? <span className="gain-badge text-[10px] font-medium px-2 py-0.5 rounded">Worth Grading</span>
          : <span className="text-[10px] font-medium px-2 py-0.5 rounded surface-2 text-[var(--text-tertiary)]">Not Recommended</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-premium">
          <thead>
            <tr>
              <th className="text-left px-3 py-2.5">Company</th>
              <th className="text-left px-3 py-2.5">Grade</th>
              <th className="text-right px-3 py-2.5">Raw</th>
              <th className="text-right px-3 py-2.5">Graded</th>
              <th className="text-right px-3 py-2.5">Cost</th>
              <th className="text-right px-3 py-2.5">Profit</th>
              <th className="text-right px-3 py-2.5">Margin</th>
            </tr>
          </thead>
          <tbody>
            {recs.map((r, i) => (
              <tr key={i}>
                <td className="px-3 py-2 text-[12px] font-medium">{r.company}</td>
                <td className="px-3 py-2 text-[12px]">{r.grade}</td>
                <td className="px-3 py-2 text-right text-[12px] text-value text-[var(--text-secondary)]">${r.rawPrice.toFixed(2)}</td>
                <td className="px-3 py-2 text-right text-[12px] text-value">{r.gradedPrice ? `$${r.gradedPrice.toFixed(2)}` : '—'}</td>
                <td className="px-3 py-2 text-right text-[12px] text-value text-[var(--text-secondary)]">${r.gradingCost.toFixed(2)}</td>
                <td className={`px-3 py-2 text-right text-[12px] text-value font-medium ${(r.potentialProfit || 0) > 0 ? 'gain-text' : 'loss-text'}`}>
                  {r.potentialProfit !== null ? `$${r.potentialProfit.toFixed(2)}` : '—'}
                </td>
                <td className={`px-3 py-2 text-right text-[12px] text-value ${(r.profitMargin || 0) > 30 ? 'gain-text' : 'text-[var(--text-tertiary)]'}`}>
                  {r.profitMargin !== null ? `${r.profitMargin.toFixed(0)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2.5 border-t border-[var(--border-subtle)]">
        <p className="text-[10px] text-[var(--text-tertiary)]">
          Est. costs — PSA: ${GRADING_COSTS.PSA.minCost}–${GRADING_COSTS.PSA.maxCost}, BGS: ${GRADING_COSTS.BGS.minCost}–${GRADING_COSTS.BGS.maxCost}, CGC: ${GRADING_COSTS.CGC.minCost}–${GRADING_COSTS.CGC.maxCost}. Recommended when margin exceeds 30%.
        </p>
      </div>
    </div>
  )
}

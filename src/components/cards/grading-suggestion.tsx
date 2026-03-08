'use client'

import { GRADING_COSTS, getGradingRecommendation, type GradingRecommendation } from '@/lib/pricing/grading'

interface GradedPrice {
  grading_company: string
  grade: string
  price: number | null
}

interface GradingSuggestionProps {
  rawPrice: number | null
  gradedPrices: GradedPrice[]
}

export function GradingSuggestion({ rawPrice, gradedPrices }: GradingSuggestionProps) {
  if (!rawPrice || gradedPrices.length === 0) return null

  const recs = gradedPrices
    .filter((gp) => gp.price)
    .map((gp) => getGradingRecommendation(rawPrice, gp.price, gp.grading_company, gp.grade))

  if (recs.length === 0) return null

  const best = recs.reduce((b, r) =>
    (r.potentialProfit || 0) > (b.potentialProfit || 0) ? r : b
  )

  const anyWorthGrading = recs.some((r) => r.shouldGrade)

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <h3 className="text-[14px] font-semibold tracking-tight">Grading Intelligence</h3>
          </div>
          {anyWorthGrading ? (
            <span className="gain-badge text-[10px] font-semibold px-2.5 py-1 rounded-md tracking-wide uppercase">
              Worth Grading
            </span>
          ) : (
            <span className="chip text-[10px] font-medium">Not Recommended</span>
          )}
        </div>
      </div>

      {/* Best Option Highlight */}
      {best.shouldGrade && best.potentialProfit !== null && (
        <div className="surface-gold px-4 py-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-eyebrow mb-0.5">Best Option</p>
              <p className="text-[13px] font-semibold">
                {best.company} {best.grade}
              </p>
            </div>
            <div className="text-right">
              <p className="text-eyebrow mb-0.5">Potential Profit</p>
              <p className="text-metric-sm gain-text font-semibold">
                +${best.potentialProfit.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="panel-body-flush">
        <div className="overflow-x-auto">
          <table className="w-full table-premium table-striped">
            <thead>
              <tr>
                <th className="text-left px-4 py-3 text-[11px]">Company</th>
                <th className="text-left px-4 py-3 text-[11px]">Grade</th>
                <th className="text-right px-4 py-3 text-[11px]">Raw</th>
                <th className="text-right px-4 py-3 text-[11px]">Graded</th>
                <th className="text-right px-4 py-3 text-[11px]">Cost</th>
                <th className="text-right px-4 py-3 text-[11px]">Profit</th>
                <th className="text-right px-4 py-3 text-[11px]">Margin</th>
              </tr>
            </thead>
            <tbody>
              {recs.map((r, i) => {
                const isBest =
                  r.company === best.company &&
                  r.grade === best.grade &&
                  best.shouldGrade

                return (
                  <tr
                    key={i}
                    className={isBest ? 'surface-gold' : ''}
                  >
                    <td className="px-4 py-3 text-[12px] font-semibold">{r.company}</td>
                    <td className="px-4 py-3 text-[12px] font-medium">{r.grade}</td>
                    <td className="px-4 py-3 text-right text-[12px] text-value text-[var(--text-tertiary)]">
                      ${r.rawPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-[12px] text-value font-medium">
                      {r.gradedPrice ? `$${r.gradedPrice.toFixed(2)}` : '\u2014'}
                    </td>
                    <td className="px-4 py-3 text-right text-[12px] text-value text-[var(--text-tertiary)]">
                      ${r.gradingCost.toFixed(2)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right text-[12px] text-value font-semibold ${
                        (r.potentialProfit || 0) > 0 ? 'gain-text' : 'loss-text'
                      }`}
                    >
                      {r.potentialProfit !== null
                        ? `${r.potentialProfit >= 0 ? '+' : ''}$${r.potentialProfit.toFixed(2)}`
                        : '\u2014'}
                    </td>
                    <td
                      className={`px-4 py-3 text-right text-[12px] text-value font-medium ${
                        (r.profitMargin || 0) > 30 ? 'gain-text' : 'text-[var(--text-tertiary)]'
                      }`}
                    >
                      {r.profitMargin !== null ? `${r.profitMargin.toFixed(0)}%` : '\u2014'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel-footer">
        <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed">
          Estimated grading costs — PSA: ${GRADING_COSTS.PSA.minCost}\u2013${GRADING_COSTS.PSA.maxCost},
          BGS: ${GRADING_COSTS.BGS.minCost}\u2013${GRADING_COSTS.BGS.maxCost},
          CGC: ${GRADING_COSTS.CGC.minCost}\u2013${GRADING_COSTS.CGC.maxCost}.
          Grading is recommended when the profit margin exceeds 30%.
        </p>
      </div>
    </div>
  )
}

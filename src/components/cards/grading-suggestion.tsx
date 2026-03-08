'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { GRADING_COSTS, getGradingRecommendation } from '@/lib/pricing/grading'

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
  if (!rawPrice || gradedPrices.length === 0) {
    return null
  }

  const recommendations = gradedPrices
    .filter(gp => gp.price)
    .map(gp => getGradingRecommendation(rawPrice, gp.price, gp.grading_company, gp.grade))

  if (recommendations.length === 0) return null

  const bestRec = recommendations.reduce((best, rec) =>
    (rec.potentialProfit || 0) > (best.potentialProfit || 0) ? rec : best
  )

  return (
    <Card className="border-white/5 bg-white/[0.02] rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--holo-cyan)] to-[var(--holo-purple)] flex items-center justify-center opacity-70">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
              </svg>
            </div>
            <CardTitle className="text-base">Grading Intelligence</CardTitle>
          </div>
          {bestRec.shouldGrade ? (
            <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 text-[10px]">Worth Grading</Badge>
          ) : (
            <Badge variant="secondary" className="bg-white/5 border-white/10 text-[10px]">Not Recommended</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground/50">Company</TableHead>
              <TableHead className="text-muted-foreground/50">Grade</TableHead>
              <TableHead className="text-right text-muted-foreground/50">Raw</TableHead>
              <TableHead className="text-right text-muted-foreground/50">Graded</TableHead>
              <TableHead className="text-right text-muted-foreground/50">Cost</TableHead>
              <TableHead className="text-right text-muted-foreground/50">Profit</TableHead>
              <TableHead className="text-right text-muted-foreground/50">Margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recommendations.map((rec, i) => (
              <TableRow key={i} className="border-white/5 hover:bg-white/[0.02]">
                <TableCell className="font-medium text-sm">{rec.company}</TableCell>
                <TableCell className="text-sm">{rec.grade}</TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">${rec.rawPrice.toFixed(2)}</TableCell>
                <TableCell className="text-right text-sm">
                  {rec.gradedPrice ? `$${rec.gradedPrice.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">${rec.gradingCost.toFixed(2)}</TableCell>
                <TableCell className={`text-right font-medium text-sm ${(rec.potentialProfit || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {rec.potentialProfit !== null ? `$${rec.potentialProfit.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell className={`text-right text-sm ${(rec.profitMargin || 0) > 30 ? 'text-green-400' : 'text-muted-foreground'}`}>
                  {rec.profitMargin !== null ? `${rec.profitMargin.toFixed(0)}%` : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 text-[10px] text-muted-foreground/40 space-y-0.5">
          <p>Grading costs are estimates. PSA: ${GRADING_COSTS.PSA.minCost}-${GRADING_COSTS.PSA.maxCost}, BGS: ${GRADING_COSTS.BGS.minCost}-${GRADING_COSTS.BGS.maxCost}, CGC: ${GRADING_COSTS.CGC.minCost}-${GRADING_COSTS.CGC.maxCost}</p>
          <p>Cards are recommended for grading when the estimated profit margin exceeds 30%.</p>
        </div>
      </CardContent>
    </Card>
  )
}

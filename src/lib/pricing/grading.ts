interface GradingCost {
  company: string
  minCost: number
  maxCost: number
  avgCost: number
}

export const GRADING_COSTS: Record<string, GradingCost> = {
  PSA: { company: 'PSA', minCost: 20, maxCost: 150, avgCost: 50 },
  BGS: { company: 'BGS', minCost: 25, maxCost: 100, avgCost: 40 },
  CGC: { company: 'CGC', minCost: 20, maxCost: 65, avgCost: 30 },
}

export interface GradingRecommendation {
  shouldGrade: boolean
  rawPrice: number
  gradedPrice: number | null
  gradingCost: number
  potentialProfit: number | null
  profitMargin: number | null
  company: string
  grade: string
}

export function getGradingRecommendation(
  rawPrice: number,
  gradedPrice: number | null,
  company: string = 'PSA',
  grade: string = '10'
): GradingRecommendation {
  const costs = GRADING_COSTS[company] || GRADING_COSTS.PSA
  const gradingCost = costs.avgCost

  if (!gradedPrice) {
    return {
      shouldGrade: false,
      rawPrice,
      gradedPrice: null,
      gradingCost,
      potentialProfit: null,
      profitMargin: null,
      company,
      grade,
    }
  }

  const potentialProfit = gradedPrice - rawPrice - gradingCost
  const profitMargin = (potentialProfit / (rawPrice + gradingCost)) * 100

  return {
    shouldGrade: profitMargin > 30, // Recommend if 30%+ profit margin
    rawPrice,
    gradedPrice,
    gradingCost,
    potentialProfit,
    profitMargin,
    company,
    grade,
  }
}

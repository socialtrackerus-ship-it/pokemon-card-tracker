/**
 * PSA graded card pricing via eBay market data.
 *
 * Since PSA doesn't have a public pricing API, we derive PSA graded prices
 * from eBay active listings. This gives us real market data for:
 *   - PSA 10 (Gem Mint)
 *   - PSA 9 (Mint)
 *   - PSA 8 (Near Mint-Mint)
 *
 * Also supports BGS and CGC grades.
 */

import { searchGradedPrices, isEbayConfigured } from './ebay'

export interface GradedPriceData {
  gradingCompany: string
  grade: string
  price: number | null
  source: string
  listingCount: number
}

const GRADING_COMPANIES = [
  {
    company: 'PSA',
    grades: ['10', '9', '8', '7'],
  },
  {
    company: 'BGS',
    grades: ['10', '9.5', '9', '8.5'],
  },
  {
    company: 'CGC',
    grades: ['10', '9.5', '9', '8.5'],
  },
]

/**
 * Fetch graded card prices for all major grading companies.
 * Uses eBay as the price source.
 */
export async function fetchAllGradedPrices(
  cardName: string,
  setName: string,
  companies?: string[]
): Promise<GradedPriceData[]> {
  if (!isEbayConfigured()) {
    return []
  }

  const targetCompanies = companies
    ? GRADING_COMPANIES.filter(c => companies.includes(c.company))
    : GRADING_COMPANIES

  const allPrices: GradedPriceData[] = []

  for (const { company, grades } of targetCompanies) {
    const results = await searchGradedPrices(cardName, setName, company, grades)

    for (const result of results) {
      allPrices.push({
        gradingCompany: company,
        grade: result.grade,
        price: result.avgPrice,
        source: 'ebay',
        listingCount: result.listingCount,
      })
    }

    // Rate limit between companies
    await new Promise(r => setTimeout(r, 500))
  }

  return allPrices
}

/**
 * Fetch PSA-specific graded prices.
 */
export async function fetchPSAPrices(
  cardName: string,
  setName: string
): Promise<GradedPriceData[]> {
  return fetchAllGradedPrices(cardName, setName, ['PSA'])
}

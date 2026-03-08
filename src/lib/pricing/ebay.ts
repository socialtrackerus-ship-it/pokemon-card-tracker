/**
 * eBay Browse API client for fetching market prices.
 *
 * Required env vars:
 *   EBAY_CLIENT_ID     — eBay app client ID
 *   EBAY_CLIENT_SECRET — eBay app client secret
 *
 * Uses the Application OAuth token (no user auth needed).
 * Browse API search returns active listings with prices.
 */

const TOKEN_URL = 'https://api.ebay.com/identity/v1/oauth2/token'
const BROWSE_URL = 'https://api.ebay.com/buy/browse/v1/item_summary/search'
const SCOPE = 'https://api.ebay.com/oauth/api_scope'

let cachedToken: { token: string; expiresAt: number } | null = null

export async function getEbayToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token
  }

  const clientId = process.env.EBAY_CLIENT_ID
  const clientSecret = process.env.EBAY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('EBAY_CLIENT_ID and EBAY_CLIENT_SECRET are required')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=client_credentials&scope=${encodeURIComponent(SCOPE)}`,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`eBay OAuth failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return cachedToken.token
}

export interface EbaySearchResult {
  avgPrice: number | null
  lowPrice: number | null
  highPrice: number | null
  listingCount: number
}

/**
 * Search eBay for a Pokemon card and compute average market price from active listings.
 */
export async function searchEbayPrices(
  cardName: string,
  setName: string,
  options: {
    graded?: boolean
    gradingCompany?: string
    grade?: string
  } = {}
): Promise<EbaySearchResult> {
  const token = await getEbayToken()

  // Build search query
  let query = `pokemon card ${cardName} ${setName}`
  if (options.graded && options.gradingCompany) {
    query = `${options.gradingCompany} ${options.grade || ''} ${cardName} pokemon`.trim()
  }

  const params = new URLSearchParams({
    q: query,
    category_ids: '183454', // Pokemon TCG category on eBay
    limit: '50',
    sort: 'price',
    filter: 'conditionIds:{1000|1500|2000|2500|2750|3000}', // New to Good condition
  })

  const res = await fetch(`${BROWSE_URL}?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      'X-EBAY-C-ENDUSERCTX': 'affiliateCampaignId=<eBayCampaignId>,affiliateReferenceId=<referenceId>',
    },
  })

  if (!res.ok) {
    if (res.status === 429) {
      return { avgPrice: null, lowPrice: null, highPrice: null, listingCount: 0 }
    }
    const text = await res.text()
    throw new Error(`eBay search failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  const items = data.itemSummaries || []

  if (items.length === 0) {
    return { avgPrice: null, lowPrice: null, highPrice: null, listingCount: 0 }
  }

  // Extract prices, filtering out outliers
  const prices: number[] = items
    .map((item: any) => {
      const val = item.price?.value
      return val ? parseFloat(val) : null
    })
    .filter((p: number | null): p is number => p !== null && p > 0)

  if (prices.length === 0) {
    return { avgPrice: null, lowPrice: null, highPrice: null, listingCount: 0 }
  }

  // Remove statistical outliers (beyond 2 standard deviations)
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length
  const stdDev = Math.sqrt(prices.reduce((sum, p) => sum + (p - mean) ** 2, 0) / prices.length)
  const filtered = prices.filter(p => Math.abs(p - mean) <= 2 * stdDev)

  const finalPrices = filtered.length > 0 ? filtered : prices

  const avgPrice = finalPrices.reduce((a, b) => a + b, 0) / finalPrices.length
  const lowPrice = Math.min(...finalPrices)
  const highPrice = Math.max(...finalPrices)

  return {
    avgPrice: Math.round(avgPrice * 100) / 100,
    lowPrice: Math.round(lowPrice * 100) / 100,
    highPrice: Math.round(highPrice * 100) / 100,
    listingCount: items.length,
  }
}

/**
 * Search eBay for graded card prices (PSA, BGS, CGC).
 */
export async function searchGradedPrices(
  cardName: string,
  setName: string,
  gradingCompany: string,
  grades: string[] = ['10', '9', '8']
): Promise<Array<{ grade: string; avgPrice: number | null; listingCount: number }>> {
  const results: Array<{ grade: string; avgPrice: number | null; listingCount: number }> = []

  for (const grade of grades) {
    try {
      const result = await searchEbayPrices(cardName, setName, {
        graded: true,
        gradingCompany,
        grade,
      })
      results.push({
        grade,
        avgPrice: result.avgPrice,
        listingCount: result.listingCount,
      })
      // Small delay between requests
      await new Promise(r => setTimeout(r, 300))
    } catch {
      results.push({ grade, avgPrice: null, listingCount: 0 })
    }
  }

  return results
}

/**
 * Check if eBay API credentials are configured.
 */
export function isEbayConfigured(): boolean {
  return !!(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET)
}

const BASE_URL = 'https://api.pokemontcg.io/v2'

const headers: Record<string, string> = {}
if (process.env.POKEMON_TCG_API_KEY) {
  headers['X-Api-Key'] = process.env.POKEMON_TCG_API_KEY
}

export async function fetchSets() {
  const res = await fetch(`${BASE_URL}/sets?orderBy=releaseDate`, { headers })
  if (!res.ok) throw new Error(`Failed to fetch sets: ${res.status}`)
  const data = await res.json()
  return data.data
}

export async function fetchCardsForSet(setId: string, page = 1, pageSize = 250) {
  const res = await fetch(
    `${BASE_URL}/cards?q=set.id:${setId}&pageSize=${pageSize}&page=${page}`,
    { headers }
  )
  if (!res.ok) throw new Error(`Failed to fetch cards for set ${setId}: ${res.status}`)
  const data = await res.json()
  return { cards: data.data, totalCount: data.totalCount, page: data.page, pageSize: data.pageSize }
}

export async function fetchCard(cardId: string) {
  const res = await fetch(`${BASE_URL}/cards/${cardId}`, { headers })
  if (!res.ok) throw new Error(`Failed to fetch card ${cardId}: ${res.status}`)
  const data = await res.json()
  return data.data
}

export async function searchCards(query: string, page = 1, pageSize = 20) {
  const res = await fetch(
    `${BASE_URL}/cards?q=name:"${query}"&pageSize=${pageSize}&page=${page}`,
    { headers }
  )
  if (!res.ok) throw new Error(`Failed to search cards: ${res.status}`)
  const data = await res.json()
  return { cards: data.data, totalCount: data.totalCount, page: data.page, pageSize: data.pageSize }
}

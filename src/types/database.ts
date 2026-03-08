export interface Set {
  id: string
  name: string
  series: string
  printed_total: number
  total: number
  release_date: string
  symbol_url: string | null
  logo_url: string | null
  language: string
  synced_at: string
}

export interface Card {
  id: string
  set_id: string
  name: string
  supertype: string
  subtypes: string[] | null
  hp: string | null
  types: string[] | null
  rarity: string | null
  image_small: string
  image_large: string
  number: string
  artist: string | null
  tcgplayer_url: string | null
  attacks: Attack[] | null
  abilities: Ability[] | null
  synced_at: string
}

export interface Attack {
  name: string
  cost: string[]
  convertedEnergyCost: number
  damage: string
  text: string
}

export interface Ability {
  name: string
  text: string
  type: string
}

export interface CardPrice {
  id: string
  card_id: string
  variant: string
  low: number | null
  mid: number | null
  high: number | null
  market: number | null
  updated_at: string
}

export interface CardWithPrices extends Card {
  card_prices: CardPrice[]
  set?: Set
}

export interface PriceHistory {
  id: string
  card_id: string
  variant: string
  market_price: number
  recorded_date: string
}

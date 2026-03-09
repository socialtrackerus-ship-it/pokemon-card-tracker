import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { PriceChart } from '@/components/cards/price-chart'
import { GradingSuggestion } from '@/components/cards/grading-suggestion'
import { AddToCollection } from '@/components/collection/add-to-collection'

export const dynamic = 'force-dynamic'

interface Attack {
  name: string
  cost: string[]
  convertedEnergyCost: number
  damage: string
  text: string
}

interface Ability {
  name: string
  text: string
  type: string
}

interface CardDetailPageProps {
  params: Promise<{ cardId: string }>
}

const ENERGY_COLORS: Record<string, string> = {
  Fire: 'oklch(0.65 0.2 25)',
  Water: 'oklch(0.6 0.18 240)',
  Grass: 'oklch(0.6 0.18 145)',
  Lightning: 'oklch(0.75 0.18 85)',
  Psychic: 'oklch(0.6 0.18 310)',
  Fighting: 'oklch(0.55 0.15 55)',
  Darkness: 'oklch(0.35 0.05 270)',
  Metal: 'oklch(0.65 0.02 250)',
  Dragon: 'oklch(0.6 0.15 65)',
  Fairy: 'oklch(0.7 0.15 340)',
  Colorless: 'oklch(0.6 0.01 250)',
}

function getRarityClass(rarity: string | null): string {
  if (!rarity) return 'rarity-common'
  const r = rarity.toLowerCase()
  if (r.includes('secret') || r.includes('hyper')) return 'rarity-secret'
  if (r.includes('ultra') || r.includes('illustration') || r.includes('alt')) return 'rarity-ultra'
  if (r.includes('holo') && r.includes('rare')) return 'rarity-holo'
  if (r.includes('rare')) return 'rarity-rare'
  if (r.includes('uncommon')) return 'rarity-uncommon'
  return 'rarity-common'
}

function isRare(rarity: string | null): boolean {
  if (!rarity) return false
  const r = rarity.toLowerCase()
  return r.includes('rare') || r.includes('ultra') || r.includes('secret') || r.includes('illustration')
}

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  const { cardId } = await params
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { prices: true, set: true },
  })
  if (!card) notFound()

  const gradedPrices = await prisma.gradedPrice.findMany({
    where: { cardId },
    orderBy: [{ gradingCompany: 'asc' }, { grade: 'desc' }],
  })

  // Separate prices by source
  const tcgPrices = card.prices.filter(p => p.source === 'tcgplayer')
  const cardmarketPrices = card.prices.filter(p => p.source === 'cardmarket')
  const ebayPrices = card.prices.filter(p => p.source === 'ebay')
  const prices = card.prices
  const attacks = (card.attacks || []) as unknown as Attack[]
  const abilities = (card.abilities || []) as unknown as Ability[]
  const types = (card.types || []) as unknown as string[]

  const highestMarket = prices.reduce<number | null>((max, p) => {
    if (!p.market) return max
    return max === null ? p.market : Math.max(max, p.market)
  }, null)

  const rarityClass = getRarityClass(card.rarity)
  const isPremiumRarity = isRare(card.rarity)

  return (
    <div className="container py-8 lg:py-12 animate-in">
      {/* Breadcrumb */}
      <Link
        href={`/sets/${card.set.id}`}
        className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6 group"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="opacity-50 group-hover:opacity-100 transition-opacity">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {card.set.name}
      </Link>

      <div className="grid lg:grid-cols-[420px_1fr] gap-8 lg:gap-14">
        {/* ========== LEFT COLUMN — Sticky Card Image ========== */}
        <div>
          <div className="sticky top-20 space-y-5">
            {/* Card Image */}
            <div className="card-frame-featured">
              {card.imageLarge ? (
                <div className="zoom-container">
                  <Image
                    src={card.imageLarge}
                    alt={card.name}
                    width={420}
                    height={586}
                    className="w-full h-auto rounded-lg"
                    priority
                  />
                </div>
              ) : (
                <div className="w-full aspect-[245/342] flex items-center justify-center bg-[var(--surface-2)] rounded-lg">
                  <div className="text-center px-6">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-[var(--text-tertiary)]">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                    <p className="text-sm text-[var(--text-tertiary)] mt-3">{card.name}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Image not available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="chip text-[11px]">#{card.number}</span>
              {card.rarity && (
                <span className={`${rarityClass} text-[11px] font-medium px-2.5 py-1 rounded-md`}>
                  {card.rarity}
                </span>
              )}
              {types.map((t) => (
                <span
                  key={t}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-md"
                  style={{
                    background: `color-mix(in oklch, ${ENERGY_COLORS[t] || 'oklch(0.5 0 0)'} 15%, transparent)`,
                    color: ENERGY_COLORS[t] || 'oklch(0.6 0 0)',
                    border: `1px solid color-mix(in oklch, ${ENERGY_COLORS[t] || 'oklch(0.5 0 0)'} 25%, transparent)`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Artist Credit */}
            {card.artist && (
              <p className="text-[11px] text-[var(--text-tertiary)] tracking-wide">
                Illustrated by <span className="text-[var(--text-secondary)]">{card.artist}</span>
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <AddToCollection
                cardId={card.id}
                cardName={card.name}
                variants={prices.length > 0 ? prices.map((p) => p.variant) : ['normal']}
              />
              <button className="btn-secondary flex items-center gap-2 text-[13px] px-4 py-2.5">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 3.5C4.5 3.5 2 8 2 8C2 8 4.5 12.5 8 12.5C11.5 12.5 14 8 14 8C14 8 11.5 3.5 8 3.5Z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
                </svg>
                Watch
              </button>
            </div>
          </div>
        </div>

        {/* ========== RIGHT COLUMN — Details ========== */}
        <div className="space-y-8">
          {/* Header */}
          <header className="animate-in stagger">
            <h1 className="text-display-xl font-display">{card.name}</h1>
            <div className="flex items-center gap-2.5 mt-4 flex-wrap">
              <span className="brand-badge text-[11px] font-semibold px-2.5 py-1 rounded-md tracking-wide uppercase">
                {card.supertype}
              </span>
              {card.rarity && (
                <span className={`gold-badge text-[11px] font-semibold px-2.5 py-1 rounded-md ${isPremiumRarity ? 'badge-premium' : ''}`}>
                  {card.rarity}
                </span>
              )}
              {card.hp && (
                <span className="surface-2 text-[11px] font-semibold px-2.5 py-1 rounded-md text-[var(--text-secondary)]">
                  HP {card.hp}
                </span>
              )}
              {types.map((t) => (
                <span key={t} className="surface-2 text-[11px] font-medium px-2.5 py-1 rounded-md text-[var(--text-secondary)]">
                  {t}
                </span>
              ))}
            </div>
          </header>

          {/* ===== MARKET PRICES — TCGPlayer ===== */}
          {tcgPrices.length > 0 && (
            <section className="panel animate-in">
              <div className="panel-header">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[14px] font-semibold tracking-tight">TCGPlayer Prices</h2>
                    {highestMarket !== null && (
                      <span className="price-tag-lg">${highestMarket.toFixed(2)}</span>
                    )}
                  </div>
                  {card.tcgplayerUrl && (
                    <a
                      href={card.tcgplayerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[var(--brand)] hover:underline font-medium flex items-center gap-1"
                    >
                      TCGPlayer
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M3 9L9 3M9 3H4.5M9 3V7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
              <div className="panel-body-flush">
                <div className="overflow-x-auto">
                  <table className="w-full table-premium table-striped">
                    <thead>
                      <tr>
                        <th className="text-left px-4 py-3 text-[11px]">Variant</th>
                        <th className="text-right px-4 py-3 text-[11px]">Low</th>
                        <th className="text-right px-4 py-3 text-[11px]">Mid</th>
                        <th className="text-right px-4 py-3 text-[11px]">High</th>
                        <th className="text-right px-4 py-3 text-[11px]">Market</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tcgPrices.map((p) => (
                        <tr key={`tcg-${p.variant}`}>
                          <td className="px-4 py-3 font-medium capitalize text-[13px]">{p.variant}</td>
                          <td className="px-4 py-3 text-right text-value text-[var(--text-tertiary)] text-[13px]">
                            {p.low ? `$${p.low.toFixed(2)}` : '\u2014'}
                          </td>
                          <td className="px-4 py-3 text-right text-value text-[var(--text-secondary)] text-[13px]">
                            {p.mid ? `$${p.mid.toFixed(2)}` : '\u2014'}
                          </td>
                          <td className="px-4 py-3 text-right text-value text-[var(--text-secondary)] text-[13px]">
                            {p.high ? `$${p.high.toFixed(2)}` : '\u2014'}
                          </td>
                          <td className="px-4 py-3 text-right text-value font-semibold gold-text text-[13px]">
                            {p.market ? `$${p.market.toFixed(2)}` : '\u2014'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ===== CARDMARKET PRICES ===== */}
          {cardmarketPrices.length > 0 && (
            <section className="panel animate-in">
              <div className="panel-header">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[14px] font-semibold tracking-tight">Cardmarket Prices</h2>
                    <span className="chip text-[10px]">EUR</span>
                  </div>
                </div>
              </div>
              <div className="panel-body-flush">
                <div className="overflow-x-auto">
                  <table className="w-full table-premium table-striped">
                    <thead>
                      <tr>
                        <th className="text-left px-4 py-3 text-[11px]">Variant</th>
                        <th className="text-right px-4 py-3 text-[11px]">Low</th>
                        <th className="text-right px-4 py-3 text-[11px]">Avg</th>
                        <th className="text-right px-4 py-3 text-[11px]">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cardmarketPrices.map((p) => (
                        <tr key={`cm-${p.variant}`}>
                          <td className="px-4 py-3 font-medium capitalize text-[13px]">{p.variant}</td>
                          <td className="px-4 py-3 text-right text-value text-[var(--text-tertiary)] text-[13px]">
                            {p.low ? `€${p.low.toFixed(2)}` : '\u2014'}
                          </td>
                          <td className="px-4 py-3 text-right text-value text-[var(--text-secondary)] text-[13px]">
                            {p.mid ? `€${p.mid.toFixed(2)}` : '\u2014'}
                          </td>
                          <td className="px-4 py-3 text-right text-value font-semibold gold-text text-[13px]">
                            {p.market ? `€${p.market.toFixed(2)}` : '\u2014'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ===== EBAY PRICES ===== */}
          {ebayPrices.length > 0 && (
            <section className="panel animate-in">
              <div className="panel-header">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[14px] font-semibold tracking-tight">eBay Market Prices</h2>
                    <span className="chip text-[10px]">Active Listings</span>
                  </div>
                </div>
              </div>
              <div className="panel-body-flush">
                <div className="overflow-x-auto">
                  <table className="w-full table-premium table-striped">
                    <thead>
                      <tr>
                        <th className="text-left px-4 py-3 text-[11px]">Variant</th>
                        <th className="text-right px-4 py-3 text-[11px]">Low</th>
                        <th className="text-right px-4 py-3 text-[11px]">Avg</th>
                        <th className="text-right px-4 py-3 text-[11px]">High</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ebayPrices.map((p) => (
                        <tr key={`ebay-${p.variant}`}>
                          <td className="px-4 py-3 font-medium capitalize text-[13px]">{p.variant}</td>
                          <td className="px-4 py-3 text-right text-value text-[var(--text-tertiary)] text-[13px]">
                            {p.low ? `$${p.low.toFixed(2)}` : '\u2014'}
                          </td>
                          <td className="px-4 py-3 text-right text-value font-semibold text-[13px]">
                            {p.market ? `$${p.market.toFixed(2)}` : '\u2014'}
                          </td>
                          <td className="px-4 py-3 text-right text-value text-[var(--text-secondary)] text-[13px]">
                            {p.high ? `$${p.high.toFixed(2)}` : '\u2014'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ===== PSA / GRADED PRICES ===== */}
          {gradedPrices.length > 0 && (
            <section className="panel animate-in">
              <div className="panel-header">
                <div className="flex items-center gap-3">
                  <h2 className="text-[14px] font-semibold tracking-tight">Graded Card Prices</h2>
                  <span className="chip text-[10px]">PSA &middot; BGS &middot; CGC</span>
                </div>
              </div>
              <div className="panel-body-flush">
                <div className="overflow-x-auto">
                  <table className="w-full table-premium table-striped">
                    <thead>
                      <tr>
                        <th className="text-left px-4 py-3 text-[11px]">Company</th>
                        <th className="text-left px-4 py-3 text-[11px]">Grade</th>
                        <th className="text-right px-4 py-3 text-[11px]">Price</th>
                        <th className="text-right px-4 py-3 text-[11px]">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gradedPrices.map((gp) => (
                        <tr key={`${gp.gradingCompany}-${gp.grade}`}>
                          <td className="px-4 py-3 font-semibold text-[13px]">{gp.gradingCompany}</td>
                          <td className="px-4 py-3 font-medium text-[13px]">{gp.grade}</td>
                          <td className="px-4 py-3 text-right text-value font-semibold gold-text text-[13px]">
                            {gp.price ? `$${gp.price.toFixed(2)}` : '\u2014'}
                          </td>
                          <td className="px-4 py-3 text-right text-[11px] text-[var(--text-tertiary)] capitalize">
                            {gp.source || 'market'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ===== PRICE HISTORY ===== */}
          <section className="animate-in">
            <PriceChart cardId={card.id} variant={prices[0]?.variant || 'normal'} />
          </section>

          {/* ===== GRADING INTELLIGENCE ===== */}
          <section className="animate-in">
            <GradingSuggestion
              rawPrice={prices.find((p) => p.variant === 'normal')?.market ?? null}
              gradedPrices={gradedPrices.map((gp) => ({
                grading_company: gp.gradingCompany,
                grade: gp.grade,
                price: gp.price,
              }))}
            />
          </section>

          {/* ===== ABILITIES ===== */}
          {abilities.length > 0 && (
            <section className="panel animate-in">
              <div className="panel-header">
                <h2 className="text-[14px] font-semibold tracking-tight">Abilities</h2>
              </div>
              <div className="panel-body divide-y divide-[var(--border-subtle)]">
                {abilities.map((a, i) => (
                  <div key={i} className={`${i > 0 ? 'pt-4' : ''} ${i < abilities.length - 1 ? 'pb-4' : ''}`}>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="text-[13px] font-semibold">{a.name}</span>
                      <span className="chip text-[10px]">{a.type}</span>
                    </div>
                    <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{a.text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ===== ATTACKS ===== */}
          {attacks.length > 0 && (
            <section className="panel animate-in">
              <div className="panel-header">
                <h2 className="text-[14px] font-semibold tracking-tight">Attacks</h2>
              </div>
              <div className="panel-body divide-y divide-[var(--border-subtle)]">
                {attacks.map((atk, i) => (
                  <div key={i} className={`${i > 0 ? 'pt-4' : ''} ${i < attacks.length - 1 ? 'pb-4' : ''}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[13px] font-semibold">{atk.name}</span>
                        {atk.cost && atk.cost.length > 0 && (
                          <div className="flex gap-1">
                            {atk.cost.map((c, j) => (
                              <span
                                key={j}
                                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold"
                                style={{
                                  background: `color-mix(in oklch, ${ENERGY_COLORS[c] || 'oklch(0.5 0.01 250)'} 20%, transparent)`,
                                  color: ENERGY_COLORS[c] || 'oklch(0.6 0.01 250)',
                                  border: `1px solid color-mix(in oklch, ${ENERGY_COLORS[c] || 'oklch(0.5 0.01 250)'} 30%, transparent)`,
                                }}
                              >
                                {c.charAt(0)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {atk.damage && (
                        <span className="text-metric-sm font-semibold">{atk.damage}</span>
                      )}
                    </div>
                    {atk.text && (
                      <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mt-1">{atk.text}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

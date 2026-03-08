import { prisma } from '@/lib/db'
import { ToolDefinition } from './provider'
import { getGradingRecommendation } from '@/lib/pricing/grading'

export const AI_TOOLS: ToolDefinition[] = [
  {
    name: 'search_cards',
    description: 'Search for Pokemon cards by name, set, type, or rarity',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term for card name' },
        set: { type: 'string', description: 'Set ID to filter by' },
        rarity: { type: 'string', description: 'Rarity to filter by' },
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
      required: [],
    },
  },
  {
    name: 'get_card_price',
    description: 'Get raw and graded prices for a specific card',
    parameters: {
      type: 'object',
      properties: {
        card_id: { type: 'string', description: 'The card ID' },
      },
      required: ['card_id'],
    },
  },
  {
    name: 'get_collection_summary',
    description: "Get a summary of the user's collection including total value",
    parameters: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'The user ID' },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'get_trending_cards',
    description: 'Get the most valuable or recently updated cards',
    parameters: {
      type: 'object',
      properties: {
        sort_by: { type: 'string', enum: ['market_price', 'updated_at'], description: 'Sort criteria' },
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
      required: [],
    },
  },
  {
    name: 'get_grading_recommendation',
    description: 'Get a recommendation on whether a card should be graded',
    parameters: {
      type: 'object',
      properties: {
        card_id: { type: 'string', description: 'The card ID' },
      },
      required: ['card_id'],
    },
  },
  {
    name: 'add_to_collection',
    description: "Add a card to the user's collection",
    parameters: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'The user ID' },
        card_id: { type: 'string', description: 'The card ID' },
        quantity: { type: 'number', description: 'Number of copies (default 1)' },
        condition: { type: 'string', description: 'Card condition' },
        variant: { type: 'string', description: 'Price variant (normal, holofoil, etc.)' },
      },
      required: ['user_id', 'card_id'],
    },
  },
  {
    name: 'remove_from_collection',
    description: "Remove a card from the user's collection",
    parameters: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'The user ID' },
        item_id: { type: 'string', description: 'The collection item ID' },
      },
      required: ['user_id', 'item_id'],
    },
  },
]

export async function executeTool(name: string, args: Record<string, any>): Promise<any> {
  switch (name) {
    case 'search_cards': {
      const where: any = {}
      if (args.query) where.name = { contains: args.query, mode: 'insensitive' }
      if (args.set) where.setId = args.set
      if (args.rarity) where.rarity = args.rarity

      const cards = await prisma.card.findMany({
        where,
        include: {
          set: { select: { name: true } },
          prices: { take: 1 },
        },
        take: args.limit || 10,
      })

      return cards.map(card => ({
        id: card.id,
        name: card.name,
        rarity: card.rarity,
        set: card.set.name,
        price: card.prices[0]?.market ? `$${card.prices[0].market.toFixed(2)}` : 'N/A',
      }))
    }

    case 'get_card_price': {
      const card = await prisma.card.findUnique({
        where: { id: args.card_id },
        include: {
          prices: true,
          set: { select: { name: true } },
          gradedPrices: true,
        },
      })

      if (!card) return { error: 'Card not found' }

      return {
        card: card.name,
        set: card.set.name,
        prices: card.prices.map(p => ({
          variant: p.variant,
          market: p.market ? `$${p.market.toFixed(2)}` : 'N/A',
          low: p.low ? `$${p.low.toFixed(2)}` : 'N/A',
          high: p.high ? `$${p.high.toFixed(2)}` : 'N/A',
        })),
        graded_prices: card.gradedPrices.map(gp => ({
          company: gp.gradingCompany,
          grade: gp.grade,
          price: gp.price ? `$${gp.price.toFixed(2)}` : 'N/A',
        })),
      }
    }

    case 'get_collection_summary': {
      const collection = await prisma.userCollection.findMany({
        where: { userId: args.user_id },
        include: {
          card: {
            include: { prices: true },
          },
        },
      })

      let totalValue = 0
      let totalCards = 0
      const items = collection.map(item => {
        totalCards += item.quantity
        const price = item.card.prices.find(p => p.variant === item.variant)
        const market = price?.market || 0
        totalValue += market * item.quantity
        return {
          name: item.card.name,
          quantity: item.quantity,
          value: market > 0 ? `$${(market * item.quantity).toFixed(2)}` : 'N/A',
        }
      })

      return { totalCards, uniqueCards: collection.length, totalValue: `$${totalValue.toFixed(2)}`, items }
    }

    case 'get_trending_cards': {
      const orderBy = args.sort_by === 'updated_at' ? { updatedAt: 'desc' as const } : { market: 'desc' as const }
      const data = await prisma.cardPrice.findMany({
        where: { market: { not: null } },
        orderBy,
        take: args.limit || 10,
        include: {
          card: {
            include: { set: { select: { name: true } } },
          },
        },
      })

      return data.map(item => ({
        card: item.card.name,
        set: item.card.set.name,
        rarity: item.card.rarity,
        variant: item.variant,
        market: `$${item.market!.toFixed(2)}`,
      }))
    }

    case 'get_grading_recommendation': {
      const card = await prisma.card.findUnique({
        where: { id: args.card_id },
        include: { prices: true, gradedPrices: true },
      })

      if (!card) return { error: 'Card not found' }

      const rawPrice = card.prices.find(p => p.variant === 'normal')?.market
      if (!rawPrice) return { card: card.name, recommendation: 'Cannot determine - no raw price available' }

      if (card.gradedPrices.length === 0) {
        return { card: card.name, recommendation: 'No graded price data available for comparison' }
      }

      const recommendations = card.gradedPrices
        .filter(gp => gp.price)
        .map(gp => {
          const rec = getGradingRecommendation(rawPrice, gp.price, gp.gradingCompany, gp.grade)
          return {
            company: rec.company,
            grade: rec.grade,
            shouldGrade: rec.shouldGrade,
            rawPrice: `$${rec.rawPrice.toFixed(2)}`,
            gradedPrice: rec.gradedPrice ? `$${rec.gradedPrice.toFixed(2)}` : 'N/A',
            potentialProfit: rec.potentialProfit ? `$${rec.potentialProfit.toFixed(2)}` : 'N/A',
            profitMargin: rec.profitMargin ? `${rec.profitMargin.toFixed(0)}%` : 'N/A',
          }
        })

      return { card: card.name, recommendations }
    }

    case 'add_to_collection': {
      const data = await prisma.userCollection.create({
        data: {
          userId: args.user_id,
          cardId: args.card_id,
          quantity: args.quantity || 1,
          condition: args.condition || 'Near Mint',
          variant: args.variant || 'normal',
        },
        include: { card: { select: { name: true } } },
      })

      return { success: true, message: `Added ${data.card.name} to collection` }
    }

    case 'remove_from_collection': {
      await prisma.userCollection.deleteMany({
        where: { id: args.item_id, userId: args.user_id },
      })

      return { success: true, message: 'Removed from collection' }
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}

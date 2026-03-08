import { PrismaClient } from '@prisma/client'

async function main() {
  const p = new PrismaClient()
  const sets = await p.set.count()
  const cards = await p.card.count()
  const prices = await p.cardPrice.count()
  console.log(`Sets: ${sets} | Cards: ${cards} | Prices: ${prices}`)
  await p.$disconnect()
}

main()

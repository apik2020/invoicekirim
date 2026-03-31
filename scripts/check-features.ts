import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkFeatures() {
  const features = await prisma.pricing_features.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  console.log('=== Pricing Features in Database ===')
  console.log('Total:', features.length, 'features')
  console.log('')

  features.forEach((f) => {
    console.log('[' + f.sortOrder + '] ' + f.name + ' (' + f.key + ')')
  })

  await prisma.$disconnect()
}

checkFeatures()

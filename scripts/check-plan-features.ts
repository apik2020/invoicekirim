import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const plans = await prisma.pricing_plans.findMany({
    include: {
      features: {
        include: {
          feature: true
        }
      }
    },
    orderBy: { sortOrder: 'asc' }
  })

  console.log('=== Plan Features ===')
  for (const plan of plans) {
    console.log(`\nPlan: ${plan.name} (${plan.slug})`)
    for (const pf of plan.features) {
      console.log(`  - ${pf.feature.name} (${pf.feature.key}) - ${pf.included ? 'Included' : 'Excluded'}`)
    }
  }

  await prisma.$disconnect()
}

main().catch(console.error)

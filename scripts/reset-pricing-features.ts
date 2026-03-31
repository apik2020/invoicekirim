import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetPricingFeatures() {
  console.log('🧹 Cleaning up duplicate pricing features...')

  // Delete all pricing_plan_features
  console.log('Deleting pricing plan features...')
  await prisma.pricing_plan_features.deleteMany({})

  // Delete all pricing_features
  console.log('Deleting pricing features...')
  await prisma.pricing_features.deleteMany({})

  console.log('✅ Cleanup complete. Now run seed-pricing-v2.ts to recreate with correct data.')

  await prisma.$disconnect()
}

resetPricingFeatures()

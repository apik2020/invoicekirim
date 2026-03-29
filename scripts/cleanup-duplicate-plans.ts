import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== Cleaning up duplicate plans ===\n')

  // Get all plans
  const allPlans = await prisma.pricing_plans.findMany()
  console.log('Current plans:')
  allPlans.forEach(p => console.log(`  - ${p.name} (${p.slug}) - ID: ${p.id}`))

  // Delete old/duplicate plans (keep only plan-free, plan-pro-trial, plan-pro)
  const plansToDelete = ['gratis', 'pro']  // old slugs

  console.log('\nDeleting old plans...')
  for (const slug of plansToDelete) {
    // First delete plan features
    await prisma.pricing_plan_features.deleteMany({
      where: {
        plan: {
          slug
        }
      }
    })

    // Then delete the plan
    const deleted = await prisma.pricing_plans.deleteMany({
      where: { slug }
    })

    if (deleted.count > 0) {
      console.log(`  ✓ Deleted plan: ${slug}`)
    }
  }

  // Verify remaining plans
  const remainingPlans = await prisma.pricing_plans.findMany({
    orderBy: { sortOrder: 'asc' }
  })

  console.log('\nRemaining plans:')
  remainingPlans.forEach(p => {
    console.log(`  - ${p.name} (${p.slug})`)
  })

  await prisma.$disconnect()
  console.log('\n=== Complete ===')
}

main().catch(console.error)

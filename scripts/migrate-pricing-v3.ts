import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Map old feature keys to new JSON keys
const FEATURE_KEY_MAP: Record<string, string> = {
  'invoice_limit': 'invoice_limit',
  'templates': 'templates',
  'INVOICE_TEMPLATE': 'custom_template',
  'cloud_storage': 'cloud_storage',
  'pdf_export': 'pdf_export',
  'whatsapp': 'whatsapp',
  'branding': 'custom_branding',
  'EMAIL_SEND': 'email_send',
  'CLIENT_MANAGEMENT': 'client_management',
  'ANALYTICS_VIEW': 'analytics_view',
  'priority_support': 'priority_support',
  'CUSTOM_SMTP': 'custom_smtp',
}

async function migrate() {
  console.log('=== Migrating Pricing to JSON Model ===\n')

  // 1. Get all plans with their features
  const plans = await prisma.pricing_plans.findMany({
    include: {
      features: {
        include: {
          feature: true,
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  // 2. Get yearly plan price for merging
  const yearlyPlan = plans.find(p => p.slug === 'plan-pro-yearly')
  const yearlyPrice = yearlyPlan?.price || 490000

  // 3. Migrate each plan
  for (const plan of plans) {
    // Build features JSON
    const featuresJson: Record<string, boolean | number | null> = {}

    for (const pf of plan.features) {
      const oldKey = pf.feature.key
      const newKey = FEATURE_KEY_MAP[oldKey] || oldKey

      if (!pf.included) {
        featuresJson[newKey] = false
      } else if (pf.limitValue !== null && pf.limitValue !== undefined) {
        featuresJson[newKey] = pf.limitValue
      } else {
        featuresJson[newKey] = true
      }
    }

    // Determine price_monthly and price_yearly
    let priceMonthly = plan.price
    let priceYearly = 0
    let yearlyDiscountPercent = null

    if (plan.slug === 'plan-free') {
      priceMonthly = 0
      priceYearly = 0
    } else if (plan.slug === 'plan-pro-trial') {
      priceMonthly = 0
      priceYearly = 0
    } else if (plan.slug === 'plan-pro') {
      priceMonthly = plan.price
      priceYearly = yearlyPrice
      // Calculate discount: ((monthly*12 - yearly) / (monthly*12)) * 100
      const fullYearly = priceMonthly * 12
      if (fullYearly > 0) {
        yearlyDiscountPercent = Math.round(((fullYearly - priceYearly) / fullYearly) * 100)
      }
    } else if (plan.slug === 'plan-pro-yearly') {
      // Skip - we'll merge into plan-pro
      console.log(`Skipping ${plan.slug} (will be merged into plan-pro)`)
      continue
    }

    const isPopular = plan.slug === 'plan-pro-trial' // Trial was the featured plan

    await prisma.pricing_plans.update({
      where: { id: plan.id },
      data: {
        price_monthly: priceMonthly,
        price_yearly: priceYearly,
        yearly_discount_percent: yearlyDiscountPercent,
        features_json: featuresJson,
        is_popular: isPopular,
      },
    })

    console.log(`✓ Migrated: ${plan.name} (${plan.slug})`)
    console.log(`  price_monthly: ${priceMonthly}, price_yearly: ${priceYearly}`)
    console.log(`  discount: ${yearlyDiscountPercent}%, is_popular: ${isPopular}`)
    console.log(`  features: ${JSON.stringify(featuresJson)}`)
  }

  // 4. Update subscriptions referencing plan-pro-yearly → point to plan-pro
  const proPlan = plans.find(p => p.slug === 'plan-pro')
  if (proPlan && yearlyPlan) {
    const updatedSubs = await prisma.subscriptions.updateMany({
      where: { pricingPlanId: yearlyPlan.id },
      data: {
        pricingPlanId: proPlan.id,
        billingCycle: 'YEARLY',
      },
    })
    console.log(`\n✓ Updated ${updatedSubs.count} subscription(s) from plan-pro-yearly → plan-pro (YEARLY)`)
  }

  // 5. Update payments referencing plan-pro-yearly → point to plan-pro
  if (proPlan && yearlyPlan) {
    const updatedPayments = await prisma.payments.updateMany({
      where: { pricingPlanId: yearlyPlan.id },
      data: { pricingPlanId: proPlan.id },
    })
    console.log(`✓ Updated ${updatedPayments.count} payment(s) from plan-pro-yearly → plan-pro`)
  }

  // 6. Delete plan-pro-yearly (remove features first due to FK)
  if (yearlyPlan) {
    await prisma.pricing_plan_features.deleteMany({
      where: { planId: yearlyPlan.id },
    })
    await prisma.pricing_plans.delete({
      where: { id: yearlyPlan.id },
    })
    console.log(`\n✓ Deleted plan: plan-pro-yearly`)
  }

  console.log('\n=== Migration Complete ===')
}

migrate()
  .catch((e) => {
    console.error('Migration error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

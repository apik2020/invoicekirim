import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const plans = [
  {
    id: 'plan-free',
    name: 'Free',
    slug: 'plan-free',
    description: 'Untuk freelancer yang baru mulai',
    price_monthly: 0,
    price_yearly: 0,
    yearly_discount_percent: null,
    currency: 'IDR',
    stripePriceId: null,
    trialDays: 0,
    is_popular: false,
    isActive: true,
    sortOrder: 1,
    ctaText: 'Mulai Gratis',
    features_json: {
      invoice_limit: 5,
      whatsapp: true,
      pdf_export: true,
      email_send: true,
      custom_template: false,
      custom_branding: false,
      analytics_view: false,
      custom_smtp: false,
    },
  },
  {
    id: 'plan-basic',
    name: 'Basic',
    slug: 'plan-basic',
    description: 'Untuk freelancer yang butuh fitur lengkap',
    price_monthly: 19000,
    price_yearly: 190000,
    yearly_discount_percent: null as number | null,
    currency: 'IDR',
    stripePriceId: null,
    trialDays: 0,
    is_popular: true,
    isActive: true,
    sortOrder: 2,
    ctaText: 'Mulai Basic',
    features_json: {
      invoice_limit: 25,
      whatsapp: true,
      pdf_export: true,
      email_send: true,
      custom_template: true,
      custom_branding: true,
      analytics_view: true,
      custom_smtp: true,
    },
  },
  {
    id: 'plan-professional',
    name: 'Profesional',
    slug: 'plan-professional',
    description: 'Untuk profesional dengan kebutuhan tanpa batas',
    price_monthly: 49000,
    price_yearly: 490000,
    yearly_discount_percent: null as number | null,
    currency: 'IDR',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || null,
    trialDays: 0,
    is_popular: false,
    isActive: true,
    sortOrder: 3,
    ctaText: 'Berlangganan Profesional',
    features_json: {
      invoice_limit: true,
      whatsapp: true,
      pdf_export: true,
      email_send: true,
      custom_template: true,
      custom_branding: true,
      analytics_view: true,
      custom_smtp: true,
    },
  },
]

async function seedPricing() {
  console.log('=== Seeding Pricing (Free/Basic/Profesional) ===')

  // Deactivate old plans that no longer exist
  const oldSlugs = ['plan-pro-trial', 'plan-pro']
  for (const slug of oldSlugs) {
    try {
      await prisma.pricing_plans.updateMany({
        where: { slug },
        data: { isActive: false },
      })
    } catch {}
  }

  for (const plan of plans) {
    // Auto-calculate discount
    if (plan.price_monthly > 0 && plan.price_yearly > 0) {
      const fullYearly = plan.price_monthly * 12
      const discount = Math.round(((fullYearly - plan.price_yearly) / fullYearly) * 100)
      plan.yearly_discount_percent = discount > 0 ? discount : null
    }

    await prisma.pricing_plans.upsert({
      where: { id: plan.id },
      update: {
        name: plan.name,
        description: plan.description,
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        yearly_discount_percent: plan.yearly_discount_percent,
        features_json: plan.features_json,
        is_popular: plan.is_popular,
        ctaText: plan.ctaText,
        isActive: plan.isActive,
        sortOrder: plan.sortOrder,
      },
      create: plan,
    })
    console.log(`✓ Upserted plan: ${plan.name} (${plan.slug}) — monthly: ${plan.price_monthly}, yearly: ${plan.price_yearly}, discount: ${plan.yearly_discount_percent}%`)
  }

  // Migrate subscriptions from old plans to new ones
  console.log('\n--- Migrating existing subscriptions ---')

  // plan-pro-trial → plan-basic
  const trialSubs = await prisma.subscriptions.findMany({
    where: { pricingPlanId: 'plan-pro-trial' },
    select: { id: true },
  })
  if (trialSubs.length > 0) {
    await prisma.subscriptions.updateMany({
      where: { pricingPlanId: 'plan-pro-trial' },
      data: { pricingPlanId: 'plan-basic', planType: 'PRO' },
    })
    console.log(`✓ Migrated ${trialSubs.length} trial subscriptions → plan-basic`)
  }

  // plan-pro → plan-professional
  const proSubs = await prisma.subscriptions.findMany({
    where: { pricingPlanId: 'plan-pro' },
    select: { id: true },
  })
  if (proSubs.length > 0) {
    await prisma.subscriptions.updateMany({
      where: { pricingPlanId: 'plan-pro' },
      data: { pricingPlanId: 'plan-professional', planType: 'PRO' },
    })
    console.log(`✓ Migrated ${proSubs.length} pro subscriptions → plan-professional`)
  }

  // Subscriptions with no pricingPlanId → plan-free
  const freeSubs = await prisma.subscriptions.findMany({
    where: { pricingPlanId: null, planType: 'FREE' },
    select: { id: true },
  })
  if (freeSubs.length > 0) {
    await prisma.subscriptions.updateMany({
      where: { pricingPlanId: null, planType: 'FREE' },
      data: { pricingPlanId: 'plan-free' },
    })
    console.log(`✓ Migrated ${freeSubs.length} free subscriptions → plan-free`)
  }

  console.log('\n=== Seed Complete ===')
}

seedPricing()
  .catch((e) => {
    console.error('Error seeding pricing:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const features = [
  {
    id: 'feat-invoice-limit',
    name: 'Batas Invoice',
    key: 'invoice_limit',
    description: 'Jumlah invoice yang dapat dibuat per bulan',
    sortOrder: 1,
  },
  {
    id: 'feat-templates',
    name: 'Template Invoice',
    key: 'templates',
    description: 'Akses ke template invoice',
    sortOrder: 2,
  },
  {
    id: 'feat-cloud-storage',
    name: 'Simpan di Cloud',
    key: 'cloud_storage',
    description: 'Penyimpanan data di cloud',
    sortOrder: 3,
  },
  {
    id: 'feat-pdf-export',
    name: 'Ekspor PDF',
    key: 'pdf_export',
    description: 'Ekspor invoice ke PDF',
    sortOrder: 4,
  },
  {
    id: 'feat-whatsapp',
    name: 'Kirim via WhatsApp',
    key: 'whatsapp',
    description: 'Kirim invoice melalui WhatsApp',
    sortOrder: 5,
  },
  {
    id: 'feat-branding',
    name: 'Custom Branding',
    key: 'branding',
    description: 'Kustomisasi logo dan warna',
    sortOrder: 6,
  },
  {
    id: 'feat-support',
    name: 'Priority Support',
    key: 'priority_support',
    description: 'Dukungan prioritas',
    sortOrder: 7,
  },
]

const plans = [
  {
    id: 'plan-free',
    name: 'Gratis',
    slug: 'free',
    description: 'Untuk freelancer yang baru mulai',
    price: 0,
    currency: 'IDR',
    stripePriceId: null,
    trialDays: 0,
    isFeatured: false,
    isActive: true,
    sortOrder: 1,
    ctaText: 'Mulai Gratis',
    features: [
      { featureId: 'feat-invoice-limit', included: true, limitValue: 10 },
      { featureId: 'feat-templates', included: true },
      { featureId: 'feat-cloud-storage', included: true },
      { featureId: 'feat-pdf-export', included: true },
      { featureId: 'feat-whatsapp', included: true },
      { featureId: 'feat-branding', included: false },
      { featureId: 'feat-support', included: false },
    ],
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    slug: 'pro',
    description: 'Untuk freelancer profesional',
    price: 49000,
    currency: 'IDR',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || null,
    trialDays: 7,
    isFeatured: true,
    isActive: true,
    sortOrder: 2,
    ctaText: 'Mulai Pro - Gratis 7 Hari',
    features: [
      { featureId: 'feat-invoice-limit', included: true, limitValue: null }, // unlimited
      { featureId: 'feat-templates', included: true },
      { featureId: 'feat-cloud-storage', included: true },
      { featureId: 'feat-pdf-export', included: true },
      { featureId: 'feat-whatsapp', included: true },
      { featureId: 'feat-branding', included: true },
      { featureId: 'feat-support', included: true },
    ],
  },
]

async function seedPricing() {
  console.log('=== Seeding Pricing Features ===')

  // Create features
  for (const feature of features) {
    await prisma.pricing_features.upsert({
      where: { id: feature.id },
      update: feature,
      create: feature,
    })
    console.log(`✓ Created/Updated feature: ${feature.name}`)
  }

  console.log('\n=== Seeding Pricing Plans ===')

  // Create plans with features
  for (const plan of plans) {
    const { features: planFeatures, ...planData } = plan

    // Create plan
    await prisma.pricing_plans.upsert({
      where: { id: plan.id },
      update: planData,
      create: planData,
    })
    console.log(`✓ Created/Updated plan: ${plan.name}`)

    // Delete existing plan features
    await prisma.pricing_plan_features.deleteMany({
      where: { planId: plan.id },
    })

    // Create plan features
    for (const pf of planFeatures) {
      await prisma.pricing_plan_features.create({
        data: {
          planId: plan.id,
          featureId: pf.featureId,
          included: pf.included,
          limitValue: pf.limitValue,
        },
      })
    }
    console.log(`  ✓ Added ${planFeatures.length} features to ${plan.name}`)
  }

  console.log('\n=== Seeding Complete ===')
}

seedPricing()
  .catch((e) => {
    console.error('Error seeding pricing:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

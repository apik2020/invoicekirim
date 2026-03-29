import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// All features - aligned with user dashboard feature keys
const features = [
  {
    id: 'feat-invoice-limit',
    key: 'invoice_limit',
    name: 'Batas Invoice',
    description: 'Jumlah invoice yang dapat dibuat per bulan',
    sortOrder: 1,
  },
  {
    id: 'feat-templates',
    key: 'templates',
    name: 'Template Invoice',
    description: 'Akses ke template invoice',
    sortOrder: 2,
  },
  {
    id: 'feat-invoice-template',
    key: 'INVOICE_TEMPLATE',
    name: 'Template Custom',
    description: 'Template invoice kustom untuk branding konsisten',
    sortOrder: 3,
  },
  {
    id: 'feat-cloud-storage',
    key: 'cloud_storage',
    name: 'Simpan di Cloud',
    description: 'Penyimpanan data di cloud',
    sortOrder: 4,
  },
  {
    id: 'feat-pdf-export',
    key: 'pdf_export',
    name: 'Ekspor PDF',
    description: 'Ekspor invoice ke PDF berkualitas tinggi',
    sortOrder: 5,
  },
  {
    id: 'feat-whatsapp',
    key: 'whatsapp',
    name: 'Kirim via WhatsApp',
    description: 'Kirim invoice melalui WhatsApp',
    sortOrder: 6,
  },
  {
    id: 'feat-branding',
    key: 'branding',
    name: 'Custom Branding',
    description: 'Kustomisasi logo dan warna untuk branding profesional',
    sortOrder: 7,
  },
  {
    id: 'feat-email-send',
    key: 'EMAIL_SEND',
    name: 'Kirim Email',
    description: 'Kirim invoice langsung email ke klien',
    sortOrder: 8,
  },
  {
    id: 'feat-client-management',
    key: 'CLIENT_MANAGEMENT',
    name: 'Klien',
    description: 'Manage client database',
    sortOrder: 9,
  },
  {
    id: 'feat-analytics-view',
    key: 'ANALYTICS_VIEW',
    name: 'Analitik',
    description: 'Lihat analitik bisnis mendalam',
    sortOrder: 10,
  },
  {
    id: 'feat-team-members',
    key: 'TEAM_MEMBERS',
    name: 'Tim',
    description: 'Kolaborasi dengan anggota tim',
    sortOrder: 11,
  },
  {
    id: 'feat-api-access',
    key: 'API_ACCESS',
    name: 'Akses API',
    description: 'Akses API untuk integrasi',
    sortOrder: 12,
  },
  {
    id: 'feat-support',
    key: 'priority_support',
    name: 'Priority Support',
    description: 'Dukungan prioritas',
    sortOrder: 13,
  },
]

const plans = [
  {
    id: 'plan-free',
    name: 'Gratis',
    slug: 'plan-free',
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
      // Included features with limits
      { featureId: 'feat-invoice-limit', included: true, limitValue: 10 },
      { featureId: 'feat-templates', included: true },
      { featureId: 'feat-invoice-template', included: false },
      { featureId: 'feat-cloud-storage', included: true },
      { featureId: 'feat-pdf-export', included: true },
      { featureId: 'feat-whatsapp', included: true },
      { featureId: 'feat-branding', included: false },
      { featureId: 'feat-email-send', included: true },
      { featureId: 'feat-client-management', included: true },
      { featureId: 'feat-analytics-view', included: true },
      { featureId: 'feat-team-members', included: false },
      { featureId: 'feat-api-access', included: false },
      { featureId: 'feat-support', included: true },
    ],
  },
  {
    id: 'plan-pro-trial',
    name: 'Pro Trial',
    slug: 'plan-pro-trial',
    description: 'Coba semua fitur Pro selama 7 hari gratis',
    price: 0,
    currency: 'IDR',
    stripePriceId: null,
    trialDays: 7,
    isFeatured: true,
    isActive: true,
    sortOrder: 2,
    ctaText: 'Coba Gratis 7 Hari',
    features: [
      // All features included during trial
      { featureId: 'feat-invoice-limit', included: true, limitValue: null },
      { featureId: 'feat-templates', included: true },
      { featureId: 'feat-invoice-template', included: true },
      { featureId: 'feat-cloud-storage', included: true },
      { featureId: 'feat-pdf-export', included: true },
      { featureId: 'feat-whatsapp', included: true },
      { featureId: 'feat-branding', included: true },
      { featureId: 'feat-email-send', included: true },
      { featureId: 'feat-client-management', included: true },
      { featureId: 'feat-analytics-view', included: true },
      { featureId: 'feat-team-members', included: false },
      { featureId: 'feat-api-access', included: true },
      { featureId: 'feat-support', included: true },
    ],
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    slug: 'plan-pro',
    description: 'Untuk freelancer profesional',
    price: 49000,
    currency: 'IDR',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || null,
    trialDays: 0,
    isFeatured: false,
    isActive: true,
    sortOrder: 3,
    ctaText: 'Berlangganan Pro',
    features: [
      // All features included
      { featureId: 'feat-invoice-limit', included: true, limitValue: null },
      { featureId: 'feat-templates', included: true },
      { featureId: 'feat-invoice-template', included: true },
      { featureId: 'feat-cloud-storage', included: true },
      { featureId: 'feat-pdf-export', included: true },
      { featureId: 'feat-whatsapp', included: true },
      { featureId: 'feat-branding', included: true },
      { featureId: 'feat-email-send', included: true },
      { featureId: 'feat-client-management', included: true },
      { featureId: 'feat-analytics-view', included: true },
      { featureId: 'feat-team-members', included: false },
      { featureId: 'feat-api-access', included: true },
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
      update: {
        key: feature.key,
        name: feature.name,
        description: feature.description,
        sortOrder: feature.sortOrder,
      },
      create: feature,
    })
    console.log(`✓ Created/Updated feature: ${feature.name} (${feature.key})`)
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

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create pricing features
  const invoiceLimitFeature = await prisma.pricing_features.upsert({
    where: { id: 'feature-invoice-limit' },
    update: {},
    create: {
      id: 'feature-invoice-limit',
      name: 'Batas Invoice',
      key: 'invoice_limit',
      description: 'Jumlah invoice yang dapat dibuat per bulan',
      sortOrder: 1,
      isActive: true,
    },
  })

  const customBrandingFeature = await prisma.pricing_features.upsert({
    where: { id: 'feature-custom-branding' },
    update: {},
    create: {
      id: 'feature-custom-branding',
      name: 'Custom Branding',
      key: 'custom_branding',
      description: 'Kustomisasi logo dan warna brand',
      sortOrder: 2,
      isActive: true,
    },
  })

  const unlimitedClientsFeature = await prisma.pricing_features.upsert({
    where: { id: 'feature-unlimited-clients' },
    update: {},
    create: {
      id: 'feature-unlimited-clients',
      name: 'Klien Unlimited',
      key: 'unlimited_clients',
      description: 'Tidak ada batasan jumlah klien',
      sortOrder: 3,
      isActive: true,
    },
  })

  const exportPdfFeature = await prisma.pricing_features.upsert({
    where: { id: 'feature-export-pdf' },
    update: {},
    create: {
      id: 'feature-export-pdf',
      name: 'Export PDF',
      key: 'export_pdf',
      description: 'Export invoice ke PDF',
      sortOrder: 4,
      isActive: true,
    },
  })

  const prioritySupportFeature = await prisma.pricing_features.upsert({
    where: { id: 'feature-priority-support' },
    update: {},
    create: {
      id: 'feature-priority-support',
      name: 'Prioritas Support',
      key: 'priority_support',
      description: 'Dukungan prioritas via email',
      sortOrder: 5,
      isActive: true,
    },
  })

  console.log('Created pricing features')

  // Create FREE plan
  const freePlan = await prisma.pricing_plans.upsert({
    where: { id: 'plan-free' },
    update: {},
    create: {
      id: 'plan-free',
      name: 'Gratis',
      slug: 'free',
      description: 'Untuk freelancer pemula',
      price: 0,
      currency: 'IDR',
      trialDays: 0,
      isFeatured: false,
      isActive: true,
      sortOrder: 1,
      ctaText: 'Mulai Gratis',
    },
  })

  // Create PRO plan
  const proPlan = await prisma.pricing_plans.upsert({
    where: { id: 'plan-pro' },
    update: {},
    create: {
      id: 'plan-pro',
      name: 'Pro',
      slug: 'pro',
      description: 'Untuk freelancer profesional',
      price: 49000,
      currency: 'IDR',
      trialDays: 7,
      isFeatured: true,
      isActive: true,
      sortOrder: 2,
      ctaText: 'Mulai Pro - Gratis 7 Hari',
    },
  })

  console.log('Created pricing plans')

  // Create plan features for FREE plan
  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: freePlan.id, featureId: invoiceLimitFeature.id } },
    update: { included: true, limitValue: 10 },
    create: {
      planId: freePlan.id,
      featureId: invoiceLimitFeature.id,
      included: true,
      limitValue: 10,
    },
  })

  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: freePlan.id, featureId: customBrandingFeature.id } },
    update: { included: false },
    create: {
      planId: freePlan.id,
      featureId: customBrandingFeature.id,
      included: false,
    },
  })

  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: freePlan.id, featureId: unlimitedClientsFeature.id } },
    update: { included: false },
    create: {
      planId: freePlan.id,
      featureId: unlimitedClientsFeature.id,
      included: false,
    },
  })

  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: freePlan.id, featureId: exportPdfFeature.id } },
    update: { included: true },
    create: {
      planId: freePlan.id,
      featureId: exportPdfFeature.id,
      included: true,
    },
  })

  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: freePlan.id, featureId: prioritySupportFeature.id } },
    update: { included: false },
    create: {
      planId: freePlan.id,
      featureId: prioritySupportFeature.id,
      included: false,
    },
  })

  // Create plan features for PRO plan
  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: proPlan.id, featureId: invoiceLimitFeature.id } },
    update: { included: true, limitValue: null },
    create: {
      planId: proPlan.id,
      featureId: invoiceLimitFeature.id,
      included: true,
      limitValue: null, // Unlimited
    },
  })

  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: proPlan.id, featureId: customBrandingFeature.id } },
    update: { included: true },
    create: {
      planId: proPlan.id,
      featureId: customBrandingFeature.id,
      included: true,
    },
  })

  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: proPlan.id, featureId: unlimitedClientsFeature.id } },
    update: { included: true },
    create: {
      planId: proPlan.id,
      featureId: unlimitedClientsFeature.id,
      included: true,
    },
  })

  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: proPlan.id, featureId: exportPdfFeature.id } },
    update: { included: true },
    create: {
      planId: proPlan.id,
      featureId: exportPdfFeature.id,
      included: true,
    },
  })

  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: proPlan.id, featureId: prioritySupportFeature.id } },
    update: { included: true },
    create: {
      planId: proPlan.id,
      featureId: prioritySupportFeature.id,
      included: true,
    },
  })

  console.log('Created plan features')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)

  const admin = await prisma.admins.upsert({
    where: { email: 'admin@invoicekirim.com' },
    update: {
      updatedAt: new Date(),
    },
    create: {
      id: crypto.randomUUID(),
      email: 'admin@invoicekirim.com',
      name: 'Admin',
      password: adminPassword,
      updatedAt: new Date(),
    },
  })

  console.log('Created admin user:', admin)

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 12)

  const user = await prisma.users.upsert({
    where: { email: 'test@example.com' },
    update: {
      updatedAt: new Date(),
    },
    create: {
      id: crypto.randomUUID(),
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
      updatedAt: new Date(),
    },
  })

  // Create subscription for test user
  await prisma.subscriptions.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      id: crypto.randomUUID(),
      userId: user.id,
      status: 'FREE',
      planType: 'FREE',
      updatedAt: new Date(),
    },
  })

  console.log('Created test user:', user)

  // Create sample invoice
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const invoiceNumber = `INV-${year}-${month}-001`

  const invoice = await prisma.invoices.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      invoiceNumber,
      accessToken: crypto.randomUUID(),
      date: new Date(),
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      companyName: 'Test Company',
      companyEmail: 'test@example.com',
      companyPhone: '+628123456789',
      companyAddress: 'Jakarta, Indonesia',
      clientName: 'Test Client',
      clientEmail: 'client@example.com',
      clientPhone: '+628987654321',
      clientAddress: 'Bandung, Indonesia',
      notes: 'Thank you for your business!',
      taxRate: 11,
      subtotal: 1000000,
      taxAmount: 110000,
      total: 1110000,
      status: 'DRAFT',
      updatedAt: new Date(),
    },
  })

  // Create invoice item
  await prisma.invoice_items.create({
    data: {
      id: crypto.randomUUID(),
      invoiceId: invoice.id,
      description: 'Web Development Service',
      quantity: 1,
      price: 1000000,
      subtotal: 1000000,
    },
  })

  console.log('Created sample invoice:', invoice.invoiceNumber)

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

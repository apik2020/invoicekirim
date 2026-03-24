import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create pricing features with standardized uppercase keys
  const invoiceCreateFeature = await prisma.pricing_features.upsert({
    where: { id: 'feat-invoice-create' },
    update: {},
    create: {
      id: 'feat-invoice-create',
      name: 'Buat Invoice',
      key: 'INVOICE_CREATE',
      description: 'Membuat invoice baru per bulan',
      sortOrder: 1,
      isActive: true,
    },
  })

  const invoiceTemplateFeature = await prisma.pricing_features.upsert({
    where: { id: 'feat-invoice-template' },
    update: {},
    create: {
      id: 'feat-invoice-template',
      name: 'Template Custom',
      key: 'INVOICE_TEMPLATE',
      description: 'Template invoice kustom',
      sortOrder: 2,
      isActive: true,
    },
  })

  const customBrandingFeature = await prisma.pricing_features.upsert({
    where: { id: 'feat-custom-branding' },
    update: {},
    create: {
      id: 'feat-custom-branding',
      name: 'Custom Branding',
      key: 'CUSTOM_BRANDING',
      description: 'Logo dan warna kustom',
      sortOrder: 3,
      isActive: true,
    },
  })

  const exportPdfFeature = await prisma.pricing_features.upsert({
    where: { id: 'feat-export-pdf' },
    update: {},
    create: {
      id: 'feat-export-pdf',
      name: 'Export PDF',
      key: 'EXPORT_PDF',
      description: 'Export invoice ke PDF',
      sortOrder: 4,
      isActive: true,
    },
  })

  const emailSendFeature = await prisma.pricing_features.upsert({
    where: { id: 'feat-email-send' },
    update: {},
    create: {
      id: 'feat-email-send',
      name: 'Kirim Email',
      key: 'EMAIL_SEND',
      description: 'Kirim invoice via email',
      sortOrder: 5,
      isActive: true,
    },
  })

  const clientManagementFeature = await prisma.pricing_features.upsert({
    where: { id: 'feat-client-management' },
    update: {},
    create: {
      id: 'feat-client-management',
      name: 'Klien',
      key: 'CLIENT_MANAGEMENT',
      description: 'Manage client database',
      sortOrder: 6,
      isActive: true,
    },
  })

  const analyticsViewFeature = await prisma.pricing_features.upsert({
    where: { id: 'feat-analytics-view' },
    update: {},
    create: {
      id: 'feat-analytics-view',
      name: 'Analitik',
      key: 'ANALYTICS_VIEW',
      description: 'Lihat analitik bisnis',
      sortOrder: 7,
      isActive: true,
    },
  })

  const teamMembersFeature = await prisma.pricing_features.upsert({
    where: { id: 'feat-team-members' },
    update: {},
    create: {
      id: 'feat-team-members',
      name: 'Tim',
      key: 'TEAM_MEMBERS',
      description: 'Tambah anggota tim',
      sortOrder: 8,
      isActive: true,
    },
  })

  const prioritySupportFeature = await prisma.pricing_features.upsert({
    where: { id: 'feat-priority-support' },
    update: {},
    create: {
      id: 'feat-priority-support',
      name: 'Prioritas Support',
      key: 'PRIORITY_SUPPORT',
      description: 'Dukungan prioritas via email',
      sortOrder: 9,
      isActive: true,
    },
  })

  const apiAccessFeature = await prisma.pricing_features.upsert({
    where: { id: 'feat-api-access' },
    update: {},
    create: {
      id: 'feat-api-access',
      name: 'Akses API',
      key: 'API_ACCESS',
      description: 'Akses API untuk integrasi',
      sortOrder: 10,
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
    where: { planId_featureId: { planId: freePlan.id, featureId: invoiceCreateFeature.id } },
    update: { included: true, limitValue: 10 },
    create: {
      planId: freePlan.id,
      featureId: invoiceCreateFeature.id,
      included: true,
      limitValue: 10,
    },
  })

  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: freePlan.id, featureId: invoiceTemplateFeature.id } },
    update: { included: false },
    create: {
      planId: freePlan.id,
      featureId: invoiceTemplateFeature.id,
      included: false,
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
    where: { planId_featureId: { planId: freePlan.id, featureId: exportPdfFeature.id } },
    update: { included: true, limitValue: 5 },
    create: {
      planId: freePlan.id,
      featureId: exportPdfFeature.id,
      included: true,
      limitValue: 5,
    },
  })

  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: freePlan.id, featureId: emailSendFeature.id } },
    update: { included: true, limitValue: 10 },
    create: {
      planId: freePlan.id,
      featureId: emailSendFeature.id,
      included: true,
      limitValue: 10,
    },
  })

  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: freePlan.id, featureId: clientManagementFeature.id } },
    update: { included: true, limitValue: 10 },
    create: {
      planId: freePlan.id,
      featureId: clientManagementFeature.id,
      included: true,
      limitValue: 10,
    },
  })

  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: freePlan.id, featureId: analyticsViewFeature.id } },
    update: { included: false },
    create: {
      planId: freePlan.id,
      featureId: analyticsViewFeature.id,
      included: false,
    },
  })

  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: freePlan.id, featureId: teamMembersFeature.id } },
    update: { included: false },
    create: {
      planId: freePlan.id,
      featureId: teamMembersFeature.id,
      included: false,
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

  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: freePlan.id, featureId: apiAccessFeature.id } },
    update: { included: false },
    create: {
      planId: freePlan.id,
      featureId: apiAccessFeature.id,
      included: false,
    },
  })

  // Create plan features for PRO plan (unlimited)
  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: proPlan.id, featureId: invoiceCreateFeature.id } },
    update: { included: true, limitValue: null },
    create: {
      planId: proPlan.id,
      featureId: invoiceCreateFeature.id,
      included: true,
      limitValue: null, // Unlimited
    },
  })

  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: proPlan.id, featureId: invoiceTemplateFeature.id } },
    update: { included: true },
    create: {
      planId: proPlan.id,
      featureId: invoiceTemplateFeature.id,
      included: true,
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
    where: { planId_featureId: { planId: proPlan.id, featureId: exportPdfFeature.id } },
    update: { included: true, limitValue: null },
    create: {
      planId: proPlan.id,
      featureId: exportPdfFeature.id,
      included: true,
      limitValue: null,
    },
  })

  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: proPlan.id, featureId: emailSendFeature.id } },
    update: { included: true, limitValue: null },
    create: {
      planId: proPlan.id,
      featureId: emailSendFeature.id,
      included: true,
      limitValue: null,
    },
  })

  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: proPlan.id, featureId: clientManagementFeature.id } },
    update: { included: true, limitValue: null },
    create: {
      planId: proPlan.id,
      featureId: clientManagementFeature.id,
      included: true,
      limitValue: null,
    },
  })

  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: proPlan.id, featureId: analyticsViewFeature.id } },
    update: { included: true },
    create: {
      planId: proPlan.id,
      featureId: analyticsViewFeature.id,
      included: true,
    },
  })

  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: proPlan.id, featureId: teamMembersFeature.id } },
    update: { included: true, limitValue: 5 },
    create: {
      planId: proPlan.id,
      featureId: teamMembersFeature.id,
      included: true,
      limitValue: 5,
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

  await prisma.pricing_plan_features.upsert({
    where: { planId_featureId: { planId: proPlan.id, featureId: apiAccessFeature.id } },
    update: { included: true },
    create: {
      planId: proPlan.id,
      featureId: apiAccessFeature.id,
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

  console.log('Created admin user:', admin.email)

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

  console.log('Created test user:', user.email)

  // Create sample invoice (upsert to avoid duplicate error)
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const invoiceNumber = `INV-${year}-${month}-001`

  const invoice = await prisma.invoices.upsert({
    where: { invoiceNumber },
    update: {
      updatedAt: new Date(),
    },
    create: {
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

  // Create invoice item (skip if already exists)
  const existingItem = await prisma.invoice_items.findFirst({
    where: { invoiceId: invoice.id },
  })
  if (!existingItem) {
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
  }

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

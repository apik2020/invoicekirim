import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

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

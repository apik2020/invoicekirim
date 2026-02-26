import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 12)

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
      subscription: {
        create: {
          status: 'FREE',
          planType: 'FREE',
        },
      },
    },
  })

  console.log('Created test user:', user)

  // Create sample invoice
  const invoice = await prisma.invoice.create({
    data: {
      userId: user.id,
      invoiceNumber: 'INV-001',
      date: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
      items: {
        create: [
          {
            description: 'Web Development Service',
            quantity: 1,
            price: 1000000,
          },
        ],
      },
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

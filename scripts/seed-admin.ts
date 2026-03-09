import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'hs.pramono@gmail.com'
  const password = 'admin123'

  // Create admin in Admin table (separate from users)
  const hashedPassword = await bcrypt.hash(password, 10)

  const admin = await prisma.admins.create({
    data: {
      id: crypto.randomUUID(),
      email,
      name: 'Admin',
      password: hashedPassword,
      updatedAt: new Date(),
    },
  })

  console.log('✅ Admin account created successfully!')
  console.log('Email:', email)
  console.log('Password:', password)
  console.log('Admin ID:', admin.id)
  console.log('')
  console.log('🔒 Admin accounts are stored in separate Admin table')
  console.log('🔒 Regular users are stored in User table')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

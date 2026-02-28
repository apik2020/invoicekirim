import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const admins = await prisma.admin.findMany()
  console.log('Admins in Admin table:')
  console.table(admins.map(a => ({ id: a.id, email: a.email, name: a.name })))

  const users = await prisma.user.findMany()
  console.log('\nUsers in User table:')
  console.table(users.map(u => ({ id: u.id, email: u.email, name: u.name })))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

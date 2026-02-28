import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const adminEmails = ['hs.pramono@gmail.com', 'apik2020@users.noreply.github.com']

  for (const email of adminEmails) {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (user) {
      console.log(`✅ User found: ${email}`)
    } else {
      console.log(`❌ User not found: ${email}`)
    }
  }

  // List all users
  const allUsers = await prisma.user.findMany({
    select: { email: true, name: true },
  })

  console.log('\nCurrent users:')
  console.table(allUsers)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

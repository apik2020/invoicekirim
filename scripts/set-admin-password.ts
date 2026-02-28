import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'hs.pramono@gmail.com'
  const newPassword = 'Admin@123' // Ganti dengan password yang aman

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.log(`User ${email} not found`)
    return
  }

  // Hash password baru
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // Update password user
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  })

  console.log(`✓ Password berhasil diupdate untuk ${email}`)
  console.log(`✓ Email: ${email}`)
  console.log(`✓ Password: ${newPassword}`)
  console.log('\nSilakan login dengan password baru ini.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

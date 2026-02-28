import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'hs.pramono@gmail.com'

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
    },
  })

  if (!user) {
    console.log('User not found')
    return
  }

  console.log('Current user data:')
  console.log('- Email:', user.email)
  console.log('- Name:', user.name)
  console.log('- Has Password:', !!user.password)

  if (!user.password) {
    console.log('\n⚠️  User does not have a password! Creating one now...')

    const newPassword = 'admin123' // Password sederhana tanpa simbol
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    })

    console.log('✓ Password created successfully')
    console.log(`✓ Email: ${email}`)
    console.log(`✓ Password: ${newPassword}`)
  } else {
    // Test password verification
    const testPassword = 'admin123'
    const isValid = await bcrypt.compare(testPassword, user.password)

    console.log('\nPassword test (admin123):', isValid ? 'VALID ✓' : 'INVALID ✗')

    if (!isValid) {
      console.log('\nResetting password...')
      const newPassword = 'admin123'
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      })

      console.log('✓ Password reset successfully')
      console.log(`✓ Email: ${email}`)
      console.log(`✓ Password: ${newPassword}`)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

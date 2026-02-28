import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'hs.pramono@gmail.com'
  const testPassword = 'admin123'

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
    },
  })

  if (!user || !user.password) {
    console.log('❌ User or password not found')
    return
  }

  console.log('User found:', user.email)
  console.log('Has password:', !!user.password)

  // Test password verification
  const isValid = await bcrypt.compare(testPassword, user.password)

  console.log('\nPassword Test:')
  console.log('Input password:', testPassword)
  console.log('Is valid:', isValid ? '✅ YES' : '❌ NO')

  if (isValid) {
    console.log('\n✅ Password is correct! Login should work.')
  } else {
    console.log('\n❌ Password is incorrect. Resetting...')

    // Create new password hash
    const newHash = await bcrypt.hash(testPassword, 10)

    // Update user
    await prisma.user.update({
      where: { email },
      data: { password: newHash },
    })

    console.log('✅ Password reset to:', testPassword)

    // Verify new password
    const newIsValid = await bcrypt.compare(testPassword, newHash)
    console.log('Verification:', newIsValid ? '✅ PASS' : '❌ FAIL')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

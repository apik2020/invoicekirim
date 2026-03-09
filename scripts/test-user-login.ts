import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function testLogin() {
  const email = 'test123@example.com'
  const password = 'password123'
  
  try {
    // Find user
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email: true, password: true }
    })
    
    console.log('User found:', !!user)
    console.log('User email:', user?.email)
    console.log('Has password:', !!user?.password)
    console.log('Password hash length:', user?.password?.length)
    
    if (user?.password) {
      const isValid = await bcrypt.compare(password, user.password)
      console.log('Password valid:', isValid)
      
      // Also test with a fresh hash
      const freshHash = await bcrypt.hash(password, 12)
      const freshValid = await bcrypt.compare(password, freshHash)
      console.log('Fresh hash valid:', freshValid)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()

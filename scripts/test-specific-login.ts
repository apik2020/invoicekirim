import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function testLogin() {
  const email = 'hs.pramono@yahoo.com'
  const password = 'password123'
  
  console.log(`Testing login for ${email}...\n`)
  
  try {
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email: true, password: true, name: true }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('✅ User found:', user.email, '-', user.name)
    
    if (!user.password) {
      console.log('❌ User has no password (OAuth user)')
      return
    }
    
    const isValid = await bcrypt.compare(password, user.password)
    console.log(isValid ? '✅ Password verified successfully!' : '❌ Password verification failed')
    
    if (isValid) {
      console.log('\n=== NextAuth should work with these credentials ===')
      console.log('You can test by:')
      console.log('1. Open http://localhost:3000/login')
      console.log(`2. Enter email: ${email}`)
      console.log(`3. Enter password: ${password}`)
      console.log('4. Click "Masuk" button')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()

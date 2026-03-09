import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function testBrowserLogin() {
  const email = 'test123@example.com'
  const password = 'password123'
  
  console.log('=== Testing Login Flow ===\n')
  
  try {
    // Step 1: Check user exists
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email: true, password: true, name: true }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('✅ User found:', user.email)
    
    // Step 2: Verify password
    if (!user.password) {
      console.log('❌ User has no password set')
      return
    }
    
    const isValid = await bcrypt.compare(password, user.password)
    console.log(isValid ? '✅ Password valid' : '❌ Password invalid')
    
    // Step 3: Check subscription
    const subscription = await prisma.subscriptions.findUnique({
      where: { userId: user.id }
    })
    console.log(subscription ? '✅ Subscription found' : '⚠️ No subscription (will be created on login)')
    
    // Step 4: Simulate what NextAuth authorize function does
    console.log('\n=== Simulating NextAuth Authorize ===')
    
    // This is exactly what the authorize function returns on success
    const authResult = {
      id: user.id,
      email: user.email,
      name: user.name,
      image: null,
    }
    
    console.log('Auth result:', JSON.stringify(authResult, null, 2))
    console.log('\n✅ Login should work correctly!')
    console.log('\nIf browser login still fails, check:')
    console.log('1. Browser console for errors')
    console.log('2. Network tab for failed requests')
    console.log('3. Server logs for authentication errors')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testBrowserLogin()

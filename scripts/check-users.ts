import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function checkUsers() {
  console.log('=== Checking All Users ===\n')
  
  try {
    const users = await prisma.users.findMany({
      select: { 
        id: true, 
        email: true, 
        name: true, 
        password: true,
        createdAt: true 
      }
    })
    
    console.log(`Found ${users.length} users:\n`)
    
    for (const user of users) {
      console.log(`User: ${user.email}`)
      console.log(`  - Name: ${user.name || 'N/A'}`)
      console.log(`  - Has Password: ${!!user.password}`)
      console.log(`  - Password Length: ${user.password?.length || 0}`)
      console.log(`  - Created: ${user.createdAt}`)
      
      // Test if password can be verified (if they have a password)
      if (user.password) {
        // Try a simple password test
        const testPasswords = ['password123', 'password', '123456', 'test']
        for (const testPw of testPasswords) {
          const isValid = await bcrypt.compare(testPw, user.password)
          if (isValid) {
            console.log(`  - ✅ Password is: "${testPw}"`)
            break
          }
        }
      }
      console.log('')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()

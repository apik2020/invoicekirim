import { prisma } from '../src/lib/prisma'

async function checkToken() {
  const tokens = await prisma.verification_tokens.findMany({
    where: {
      identifier: 'hs.pramono@yahoo.com'
    },
    orderBy: { expires: 'desc' },
    take: 1,
  })
  
  if (tokens.length > 0) {
    const token = tokens[0]
    console.log('✅ Token found:')
    console.log(`   Identifier: ${token.identifier}`)
    console.log(`   Token: ${token.token.substring(0, 20)}...`)
    console.log(`   Expires: ${token.expires}`)
    console.log(`   Is Expired: ${token.expires < new Date()}`)
    console.log(`\n   Full Token: ${token.token}`)
  } else {
    console.log('❌ No token found')
  }
  
  await prisma.$disconnect()
}

checkToken()

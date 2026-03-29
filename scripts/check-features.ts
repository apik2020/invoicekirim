import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const features = await prisma.pricing_features.findMany({
    orderBy: { sortOrder: 'asc' }
  })

  console.log('=== Current Features in Database ===')
  features.forEach(f => {
    console.log(`ID: ${f.id} | Key: ${f.key} | Name: ${f.name}`)
  })

  console.log('\n=== Checking for duplicates ===')
  const keys = features.map(f => f.key)
  const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i)
  if (duplicates.length > 0) {
    console.log('Duplicate keys found:', duplicates)
  } else {
    console.log('No duplicate keys found')
  }

  await prisma.$disconnect()
}

main().catch(console.error)

/**
 * Fix duplicate SKUs in items table
 *
 * This script:
 * 1. Finds items with duplicate SKUs per user
 * 2. Keeps the oldest item, nullifies SKU on duplicates
 * 3. Handles empty string SKUs by converting to null
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixDuplicateSKUs() {
  console.log('🔍 Checking for duplicate SKUs...\n')

  try {
    // Step 1: Convert empty string SKUs to null
    console.log('Step 1: Converting empty string SKUs to null...')
    const emptySkuUpdate = await prisma.$executeRaw`
      UPDATE items
      SET sku = NULL
      WHERE sku = '' OR sku IS NOT NULL AND trim(sku) = ''
    `
    console.log(`✅ Converted ${emptySkuUpdate} empty SKUs to null\n`)

    // Step 2: Find all duplicate SKUs per user
    const duplicates = await prisma.$queryRaw<
      Array<{ userId: string; sku: string; count: bigint }>
    >`
      SELECT "userId", sku, COUNT(*) as count
      FROM items
      WHERE sku IS NOT NULL
      GROUP BY "userId", sku
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `

    if (duplicates.length === 0) {
      console.log('✅ No duplicate SKUs found!')
      return
    }

    console.log(`⚠️  Found ${duplicates.length} duplicate SKU groups:\n`)
    duplicates.forEach((dup) => {
      console.log(`  - User: ${dup.userId}, SKU: "${dup.sku}", Count: ${dup.count}`)
    })
    console.log('')

    // Step 3: Fix each duplicate group
    console.log('Step 2: Fixing duplicates...\n')
    let fixedCount = 0

    for (const dup of duplicates) {
      const items = await prisma.items.findMany({
        where: {
          userId: dup.userId,
          sku: dup.sku,
        },
        orderBy: {
          createdAt: 'asc', // Keep oldest
        },
      })

      if (items.length <= 1) continue

      // Keep the first (oldest), nullify SKU on others
      const [keep, ...remove] = items

      console.log(`  Fixing SKU "${dup.sku}" for user ${dup.userId}:`)
      console.log(`    ✓ Keeping item ${keep.id} (${keep.name})`)

      for (const item of remove) {
        await prisma.items.update({
          where: { id: item.id },
          data: { sku: null },
        })
        console.log(`    → Nullified SKU on item ${item.id} (${item.name})`)
        fixedCount++
      }
      console.log('')
    }

    console.log(`\n✅ Fixed ${fixedCount} duplicate items`)
    console.log('✅ You can now run: npx prisma db push')
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixDuplicateSKUs()

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting migration from DOKU columns to gateway columns...')

  try {
    // Step 1: Add gatewayOrderId column
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "gatewayOrderId" TEXT;`)
      console.log('✓ Added gatewayOrderId column')
    } catch (e) {
      console.log('⚠ gatewayOrderId column might already exist')
    }

    // Step 2: Add gatewayTransactionId column
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "gatewayTransactionId" TEXT;`)
      console.log('✓ Added gatewayTransactionId column')
    } catch (e) {
      console.log('⚠ gatewayTransactionId column might already exist')
    }

    // Step 3: Copy data from dokuOrderId to gatewayOrderId
    const ordersUpdated = await prisma.$executeRawUnsafe(`
      UPDATE payments
      SET "gatewayOrderId" = "dokuOrderId"
      WHERE "dokuOrderId" IS NOT NULL AND "gatewayOrderId" IS NULL;
    `)

    console.log(`✓ Copied ${ordersUpdated} records from dokuOrderId to gatewayOrderId`)

    // Step 4: Copy data from dokuTransactionId to gatewayTransactionId
    const transactionsUpdated = await prisma.$executeRawUnsafe(`
      UPDATE payments
      SET "gatewayTransactionId" = "dokuTransactionId"
      WHERE "dokuTransactionId" IS NOT NULL AND "gatewayTransactionId" IS NULL;
    `)

    console.log(`✓ Copied ${transactionsUpdated} records from dokuTransactionId to gatewayTransactionId`)

    // Step 5: Create unique index on gatewayOrderId
    try {
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "payments_gatewayOrderId_key" ON payments("gatewayOrderId");`)
      console.log('✓ Created unique index on gatewayOrderId')
    } catch (e) {
      console.log('⚠ Unique index might already exist')
    }

    // Step 6: Create regular index on gatewayOrderId
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX "payments_gatewayOrderId_idx" ON payments("gatewayOrderId");`)
      console.log('✓ Created index on gatewayOrderId')
    } catch (e) {
      console.log('⚠ Index might already exist')
    }

    // Step 7: Drop old dokuOrderId unique index
    try {
      await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "payments_dokuOrderId_key";`)
      console.log('✓ Dropped dokuOrderId unique index')
    } catch (e) {
      console.log('⚠ Index might not exist')
    }

    // Step 8: Drop old dokuOrderId regular index
    try {
      await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "payments_dokuOrderId_idx";`)
      console.log('✓ Dropped dokuOrderId index')
    } catch (e) {
      console.log('⚠ Index might not exist')
    }

    // Step 9: Drop dokuOrderId column
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE payments DROP COLUMN IF EXISTS "dokuOrderId";`)
      console.log('✓ Dropped dokuOrderId column')
    } catch (e) {
      console.log('⚠ Column might not exist')
    }

    // Step 10: Drop dokuTransactionId column
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE payments DROP COLUMN IF EXISTS "dokuTransactionId";`)
      console.log('✓ Dropped dokuTransactionId column')
    } catch (e) {
      console.log('⚠ Column might not exist')
    }

    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

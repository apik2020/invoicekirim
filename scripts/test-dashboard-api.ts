/**
 * Test Dashboard API Endpoint
 *
 * This script tests the dashboard API endpoint with a real user session
 * to diagnose issues in production.
 *
 * Usage:
 *   npx tsx scripts/test-dashboard-api.ts <userId>
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDashboardAPI(userId: string) {
  console.log('🔍 Testing Dashboard API for user:', userId)
  console.log('=' .repeat(60))

  try {
    // 1. Check if user exists
    console.log('\n1️⃣  Checking user...')
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    })

    if (!user) {
      console.error('❌ User not found!')
      return
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
    })

    // 2. Test invoices query
    console.log('\n2️⃣  Testing invoices query...')
    const invoices = await prisma.invoices.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { invoice_items: true },
    })
    console.log(`✅ Found ${invoices.length} invoices`)

    // 3. Test subscription query
    console.log('\n3️⃣  Testing subscription query...')
    const subscription = await prisma.subscriptions.findUnique({
      where: { userId },
    })
    console.log(subscription ? '✅ Subscription found' : '⚠️  No subscription')

    // 4. Test activity logs query
    console.log('\n4️⃣  Testing activity logs query...')
    const activityLogs = await prisma.activity_logs.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    console.log(`✅ Found ${activityLogs.length} activity logs`)

    // 5. Test due invoices query
    console.log('\n5️⃣  Testing due invoices query...')
    const dueInvoices = await prisma.invoices.findMany({
      where: {
        userId,
        dueDate: { not: null },
        status: { in: ['SENT', 'OVERDUE'] },
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    })
    console.log(`✅ Found ${dueInvoices.length} due invoices`)

    // 6. Test stats queries
    console.log('\n6️⃣  Testing stats queries...')
    const [allInvoices, stats] = await Promise.all([
      prisma.invoices.findMany({ where: { userId } }),
      prisma.invoices.groupBy({
        by: ['status'],
        where: { userId },
        _count: { id: true },
      }),
    ])
    console.log(`✅ Stats calculated from ${allInvoices.length} total invoices`)
    console.log('   Status breakdown:', stats.map(s => `${s.status}: ${s._count.id}`).join(', '))

    // 7. Test analytics queries
    console.log('\n7️⃣  Testing analytics queries...')
    const analyticsStartDate = new Date()
    analyticsStartDate.setMonth(analyticsStartDate.getMonth() - 6)

    const [analyticsInvoices, statusBreakdown] = await Promise.all([
      prisma.invoices.findMany({
        where: {
          userId,
          date: { gte: analyticsStartDate },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.invoices.groupBy({
        by: ['status'],
        where: { userId },
        _sum: { total: true },
        _count: { id: true },
      }),
    ])
    console.log(`✅ Analytics calculated from ${analyticsInvoices.length} invoices (last 6 months)`)
    console.log('   Revenue breakdown:')
    statusBreakdown.forEach(s => {
      console.log(`   - ${s.status}: ${s._count.id} invoices, total ${s._sum.total || 0}`)
    })

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ All queries completed successfully!')
    console.log('📊 Summary:')
    console.log(`   - Total invoices: ${allInvoices.length}`)
    console.log(`   - Recent invoices: ${invoices.length}`)
    console.log(`   - Due invoices: ${dueInvoices.length}`)
    console.log(`   - Activity logs: ${activityLogs.length}`)
    console.log(`   - Subscription: ${subscription ? 'Yes' : 'No'}`)

    const totalRevenue = allInvoices.reduce((sum, inv) => sum + inv.total, 0)
    console.log(`   - Total revenue: ${totalRevenue}`)

    console.log('\n✅ Dashboard API should work for this user')

  } catch (error) {
    console.error('\n❌ Error during test:', error)

    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; message?: string }
      console.error('   Prisma error code:', prismaError.code)
      console.error('   Prisma message:', prismaError.message)
    }

    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Get userId from command line args
const userId = process.argv[2]

if (!userId) {
  console.error('❌ Usage: npx tsx scripts/test-dashboard-api.ts <userId>')
  console.error('\nTo get your userId:')
  console.error('  npx prisma studio')
  console.error('  → Open users table')
  console.error('  → Copy the ID of your user')
  process.exit(1)
}

testDashboardAPI(userId)

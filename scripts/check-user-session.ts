/**
 * Check User Session
 *
 * This script helps debug session issues by checking if user exists
 * and what their current status is.
 *
 * Usage:
 *   npx tsx scripts/check-user-session.ts <email>
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUserSession(email: string) {
  console.log('🔍 Checking user session for:', email)
  console.log('='.repeat(60))

  try {
    // Find user by email
    const user = await prisma.users.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        twoFactorEnabled: true,
      }
    })

    if (!user) {
      console.error('❌ User not found with email:', email)
      console.log('\n💡 Searching for similar emails...')

      const similarUsers = await prisma.users.findMany({
        where: {
          email: {
            contains: email.split('@')[0],
            mode: 'insensitive',
          }
        },
        select: { id: true, email: true, name: true },
        take: 5,
      })

      if (similarUsers.length > 0) {
        console.log('   Found similar users:')
        similarUsers.forEach(u => console.log(`   - ${u.email} (${u.name || 'No name'})`))
      } else {
        console.log('   No similar users found')
      }

      return
    }

    console.log('\n✅ User found!')
    console.log('   ID:', user.id)
    console.log('   Email:', user.email)
    console.log('   Name:', user.name || '(not set)')
    console.log('   Email Verified:', user.emailVerified ? 'Yes' : 'No')
    console.log('   2FA Enabled:', user.twoFactorEnabled ? 'Yes' : 'No')
    console.log('   Created:', user.createdAt.toISOString())
    console.log('   Updated:', user.updatedAt.toISOString())

    // Check subscription
    console.log('\n📦 Subscription Status:')
    const subscription = await prisma.subscriptions.findUnique({
      where: { userId: user.id },
      include: {
        pricing_plans: {
          select: {
            name: true,
            slug: true,
          }
        }
      }
    })

    if (subscription) {
      console.log('   ✅ Has subscription')
      console.log('   Plan:', subscription.pricing_plans?.name || 'Unknown')
      console.log('   Status:', subscription.status)
      console.log('   Trial:', subscription.isTrial ? 'Yes' : 'No')
      if (subscription.isTrial && subscription.trialEndsAt) {
        const daysLeft = Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        console.log('   Trial days left:', daysLeft)
      }
    } else {
      console.log('   ⚠️  No subscription found')
    }

    // Check data counts
    console.log('\n📊 Data Summary:')
    const [invoiceCount, clientCount, itemCount, templateCount] = await Promise.all([
      prisma.invoices.count({ where: { userId: user.id } }),
      prisma.clients.count({ where: { userId: user.id } }),
      prisma.items.count({ where: { userId: user.id } }),
      prisma.invoice_templates.count({ where: { userId: user.id } }),
    ])

    console.log('   Invoices:', invoiceCount)
    console.log('   Clients:', clientCount)
    console.log('   Items:', itemCount)
    console.log('   Templates:', templateCount)

    // Check recent activity
    console.log('\n📝 Recent Activity:')
    const recentActivity = await prisma.activity_logs.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    if (recentActivity.length > 0) {
      recentActivity.forEach(log => {
        console.log(`   - ${log.action} (${new Date(log.createdAt).toLocaleString()})`)
      })
    } else {
      console.log('   No recent activity')
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ User session check complete')
    console.log('\n📋 Copy this for testing:')
    console.log(`   User ID: ${user.id}`)
    console.log(`   Test command: npx tsx scripts/test-dashboard-api.ts ${user.id}`)

  } catch (error) {
    console.error('\n❌ Error during check:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line args
const email = process.argv[2]

if (!email) {
  console.error('❌ Usage: npx tsx scripts/check-user-session.ts <email>')
  console.error('\nExample:')
  console.error('  npx tsx scripts/check-user-session.ts user@example.com')
  process.exit(1)
}

checkUserSession(email)

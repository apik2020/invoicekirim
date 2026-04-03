import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Clean up all user data for testing while preserving:
 * - Admin accounts and related data
 * - Subscription configuration (pricing_plans, features)
 * - System tables (email_templates, rate_limit_entries, verification_tokens)
 */

async function cleanupUserData() {
  console.log('🧹 Starting cleanup of user data...\n')

  try {
    // Get admin IDs to exclude them from deletion
    const admins = await prisma.admins.findMany({
      select: { id: true },
    })
    const adminIds = admins.map(a => a.id)
    console.log(`📋 Found ${adminIds.length} admin accounts to preserve`)

    // Delete in order to respect foreign key constraints
    // Only delete from tables that exist in the schema

    // 1. Delete team invitations
    console.log('🗑️  Deleting team invitations...')
    await prisma.team_invitations.deleteMany({})

    // 2. Delete team members
    console.log('🗑️  Deleting team members...')
    await prisma.team_members.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 3. Delete teams (this will cascade to branding, api_keys, etc.)
    console.log('🗑️  Deleting teams...')
    await prisma.teams.deleteMany({
      where: {
        ownerId: { not: { in: adminIds } },
      },
    })

    // 4. Delete invoice items (will cascade from invoices, but delete directly to be safe)
    console.log('🗑️  Deleting invoice items...')
    await prisma.invoice_items.deleteMany({})

    // 5. Delete template items
    console.log('🗑️  Deleting template items...')
    await prisma.template_items.deleteMany({})

    // 6. Delete invoice templates
    console.log('🗑️  Deleting invoice templates...')
    await prisma.invoice_templates.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 7. Delete invoices
    console.log('🗑️  Deleting invoices...')
    await prisma.invoices.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 8. Delete payments
    console.log('🗑️  Deleting payments...')
    await prisma.payments.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 9. Delete items/catalog
    console.log('🗑️  Deleting catalog items...')
    await prisma.items.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 10. Delete clients
    console.log('🗑️  Deleting clients...')
    await prisma.clients.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 11. Delete analytics snapshots
    console.log('🗑️  Deleting analytics snapshots...')
    await prisma.analytics_snapshots.deleteMany({})

    // 12. Delete webhooks
    console.log('🗑️  Deleting webhooks...')
    await prisma.webhooks.deleteMany({})

    // 13. Delete activity logs
    console.log('🗑️  Deleting activity logs...')
    await prisma.activity_logs.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 14. Delete sessions
    console.log('🗑️  Deleting sessions...')
    await prisma.sessions.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 15. Delete accounts
    console.log('🗑️  Deleting accounts...')
    await prisma.accounts.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 16. Delete subscriptions
    console.log('🗑️  Deleting subscriptions...')
    await prisma.subscriptions.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 17. Finally, delete users (except admins)
    console.log('🗑️  Deleting users...')
    const deletedUsers = await prisma.users.deleteMany({
      where: {
        id: { not: { in: adminIds } },
      },
    })
    console.log(`✅ Deleted ${deletedUsers.count} users`)

    // Summary
    console.log('\n✨ Cleanup complete! ✓')
    console.log('\n📊 Preserved data:')
    console.log(`   - Admin accounts: ${adminIds.length}`)
    console.log('   - Pricing plans configuration')
    console.log('   - Email templates')
    console.log('   - System tables')
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanupUserData()
  .then(() => {
    console.log('\n🎉 Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  })

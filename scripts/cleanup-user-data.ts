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
    // Tables without userId that reference user-related tables first

    // 1. Delete support tickets and messages (optional - user related)
    console.log('🗑️  Deleting support tickets...')
    await prisma.support_messages.deleteMany({
      where: {
        OR: [
          { userId: { not: { in: adminIds } } },
          { clientId: { not: undefined } }, // Client tickets
        ],
      },
    })
    await prisma.support_tickets.deleteMany({
      where: {
        OR: [
          { userId: { not: { in: adminIds } } },
          { userId: null }, // Client tickets without userId
        ],
      },
    })

    // 2. Delete impersonation sessions (except admin ones)
    console.log('🗑️  Deleting impersonation sessions...')
    await prisma.impersonation_sessions.deleteMany({
      where: {
        adminId: { not: { in: adminIds } },
      },
    })

    // 3. Delete announcement reads
    console.log('🗑️  Deleting announcement reads...')
    await prisma.announcement_reads.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 4. Delete client invoice access
    console.log('🗑️  Deleting client invoice access...')
    await prisma.client_invoice_access.deleteMany({})

    // 5. Delete invoice messages
    console.log('🗑️  Deleting invoice messages...')
    await prisma.invoice_messages.deleteMany({})

    // 6. Delete client notifications
    console.log('🗑️  Deleting client notifications...')
    await prisma.client_notifications.deleteMany({})

    // 7. Delete client notification preferences
    console.log('🗑️  Deleting client notification preferences...')
    await prisma.client_notification_preferences.deleteMany({})

    // 8. Delete client accounts
    console.log('🗑️  Deleting client accounts...')
    await prisma.client_accounts.deleteMany({})

    // 9. Delete analytics snapshots
    console.log('🗑️  Deleting analytics snapshots...')
    await prisma.analytics_snapshots.deleteMany({})

    // 10. Delete webhooks
    console.log('🗑️  Deleting webhooks...')
    await prisma.webhooks.deleteMany({})

    // 11. Delete team invitations
    console.log('🗑️  Deleting team invitations...')
    await prisma.team_invitations.deleteMany({})

    // 12. Delete team members
    console.log('🗑️  Deleting team members...')
    await prisma.team_members.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 13. Delete teams (this will cascade to branding, api_keys, etc.)
    console.log('🗑️  Deleting teams...')
    await prisma.teams.deleteMany({
      where: {
        ownerId: { not: { in: adminIds } },
      },
    })

    // 14. Delete invoice items (will cascade from invoices, but delete directly to be safe)
    console.log('🗑️  Deleting invoice items...')
    await prisma.invoice_items.deleteMany({})

    // 15. Delete template items
    console.log('🗑️  Deleting template items...')
    await prisma.template_items.deleteMany({})

    // 16. Delete invoice templates
    console.log('🗑️  Deleting invoice templates...')
    await prisma.invoice_templates.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 17. Delete invoices
    console.log('🗑️  Deleting invoices...')
    await prisma.invoices.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 18. Delete payments
    console.log('🗑️  Deleting payments...')
    await prisma.payments.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 19. Delete items/catalog
    console.log('🗑️  Deleting catalog items...')
    await prisma.items.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 20. Delete clients
    console.log('🗑️  Deleting clients...')
    await prisma.clients.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 21. Delete api keys
    console.log('🗑️  Deleting API keys...')
    await prisma.api_keys.deleteMany({
      where: {
        OR: [
          { userId: { not: { in: adminIds } } },
          { userId: null, teamId: { not: undefined } }, // Team keys without user
        ],
      },
    })

    // 22. Delete branding (should cascade from teams, but delete any remaining)
    console.log('🗑️  Deleting branding settings...')
    await prisma.branding.deleteMany({})

    // 23. Delete activity logs
    console.log('🗑️  Deleting activity logs...')
    await prisma.activity_logs.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 24. Delete sessions
    console.log('🗑️  Deleting sessions...')
    await prisma.sessions.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 25. Delete accounts
    console.log('🗑️  Deleting accounts...')
    await prisma.accounts.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 26. Delete subscriptions
    console.log('🗑️  Deleting subscriptions...')
    await prisma.subscriptions.deleteMany({
      where: {
        userId: { not: { in: adminIds } },
      },
    })

    // 27. Finally, delete users (except admins)
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

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Features to keep (from seed-pricing.ts)
const FEATURES_TO_KEEP = [
  'feat-invoice-limit',    // invoice_limit
  'feat-templates',         // templates
  'feat-cloud-storage',     // cloud_storage
  'feat-pdf-export',        // pdf_export (Ekspor PDF)
  'feat-whatsapp',          // whatsapp
  'feat-branding',          // branding (Custom Branding)
  'feat-support',           // priority_support (Priority Support)
]

// Duplicate features to remove and their replacements
const DUPLICATES_TO_REMOVE = [
  { id: 'feat-export-pdf', replaceWith: 'feat-pdf-export' },      // EXPORT_PDF → pdf_export
  { id: 'feat-custom-branding', replaceWith: 'feat-branding' },   // CUSTOM_BRANDING → branding
  { id: 'feat-priority-support', replaceWith: 'feat-support' },   // PRIORITY_SUPPORT → priority_support
]

// Extra features to remove (not in original seed)
const EXTRA_FEATURES_TO_REMOVE = [
  'feat-invoice-create',      // INVOICE_CREATE
  'feat-invoice-template',    // INVOICE_TEMPLATE
  'feat-email-send',          // EMAIL_SEND
  'feat-client-management',   // CLIENT_MANAGEMENT
  'feat-analytics-view',      // ANALYTICS_VIEW
  'feat-team-members',        // TEAM_MEMBERS
  'feat-api-access',          // API_ACCESS
]

async function main() {
  console.log('=== Starting Feature Cleanup ===\n')

  // First, check which features exist
  const allFeatures = await prisma.pricing_features.findMany()
  console.log(`Total features in database: ${allFeatures.length}`)

  // Remove plan-feature relationships for features we're removing
  console.log('\n1. Removing plan-feature relationships...')
  for (const featureId of [...DUPLICATES_TO_REMOVE.map(d => d.id), ...EXTRA_FEATURES_TO_REMOVE]) {
    const deleted = await prisma.pricing_plan_features.deleteMany({
      where: { featureId }
    })
    if (deleted.count > 0) {
      console.log(`   - Removed ${deleted.count} plan relationships for ${featureId}`)
    }
  }

  // Delete duplicate features
  console.log('\n2. Removing duplicate features...')
  for (const duplicate of DUPLICATES_TO_REMOVE) {
    try {
      await prisma.pricing_features.delete({
        where: { id: duplicate.id }
      })
      console.log(`   ✓ Deleted ${duplicate.id} (replaced by ${duplicate.replaceWith})`)
    } catch (e) {
      console.log(`   - ${duplicate.id} not found or already deleted`)
    }
  }

  // Delete extra features
  console.log('\n3. Removing extra features...')
  for (const featureId of EXTRA_FEATURES_TO_REMOVE) {
    try {
      await prisma.pricing_features.delete({
        where: { id: featureId }
      })
      console.log(`   ✓ Deleted ${featureId}`)
    } catch (e) {
      console.log(`   - ${featureId} not found or already deleted`)
    }
  }

  // Verify cleanup
  console.log('\n4. Verifying cleanup...')
  const remainingFeatures = await prisma.pricing_features.findMany({
    orderBy: { sortOrder: 'asc' }
  })

  console.log(`\nRemaining features (${remainingFeatures.length}):`)
  remainingFeatures.forEach(f => {
    console.log(`  - ${f.name} (${f.key})`)
  })

  // Check plan features after cleanup
  console.log('\n5. Plan features after cleanup:')
  const plans = await prisma.pricing_plans.findMany({
    include: {
      features: {
        include: {
          feature: true
        }
      }
    },
    orderBy: { sortOrder: 'asc' }
  })

  for (const plan of plans) {
    console.log(`\n  ${plan.name}: ${plan.features.length} features`)
  }

  await prisma.$disconnect()
  console.log('\n=== Cleanup Complete ===')
}

main().catch(console.error)

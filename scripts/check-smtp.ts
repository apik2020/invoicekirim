import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAdminSMTP() {
  const admin = await prisma.admins.findFirst({
    select: {
      email: true,
      smtpHost: true,
      smtpPort: true,
      smtpSecure: true,
      smtpUser: true,
      smtpFromName: true,
      smtpFromEmail: true,
    }
  })

  console.log('=== Admin SMTP Settings ===')
  console.log('Admin Email:', admin?.email)
  console.log('SMTP Host:', admin?.smtpHost || 'NOT SET')
  console.log('SMTP Port:', admin?.smtpPort || 'NOT SET')
  console.log('SMTP Secure:', admin?.smtpSecure ?? 'NOT SET')
  console.log('SMTP User:', admin?.smtpUser || 'NOT SET')
  console.log('SMTP From Name:', admin?.smtpFromName || 'NOT SET')
  console.log('SMTP From Email:', admin?.smtpFromEmail || 'NOT SET')
  console.log('SMTP Password:', admin?.smtpUser ? '[SET]' : 'NOT SET')

  const isConfigured = admin?.smtpHost && admin?.smtpUser && admin?.smtpFromEmail
  console.log('\n✓ SMTP Configured:', isConfigured ? 'YES ✓' : 'NO ✗')

  if (!isConfigured) {
    console.log('\n⚠️  Please configure SMTP settings at: /admin/settings/email')
  }

  await prisma.$disconnect()
}

checkAdminSMTP().catch((e) => {
  console.error(e)
  process.exit(1)
})

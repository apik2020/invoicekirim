import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'

const prisma = new PrismaClient()

async function testSendEmail() {
  // Get admin SMTP settings
  const admin = await prisma.admins.findFirst({
    select: {
      email: true,
      name: true,
      smtpHost: true,
      smtpPort: true,
      smtpSecure: true,
      smtpUser: true,
      smtpPass: true,
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
  console.log('SMTP Password:', admin?.smtpPass ? '[SET]' : 'NOT SET')

  const isConfigured = admin?.smtpHost && admin?.smtpUser && admin?.smtpPass && admin?.smtpFromEmail
  console.log('\n✓ SMTP Configured:', isConfigured ? 'YES ✓' : 'NO ✗')

  if (!isConfigured) {
    console.log('\n⚠️  Please configure SMTP settings at: /admin/settings/email')
    await prisma.$disconnect()
    return
  }

  // Test sending email
  console.log('\n=== Testing Email Send ===')
  const testEmail = 'hs.pramono@yahoo.com'

  try {
    const transporter = nodemailer.createTransport({
      host: admin!.smtpHost!,
      port: parseInt(admin!.smtpPort || '587'),
      secure: admin!.smtpSecure === true,
      auth: {
        user: admin!.smtpUser!,
        pass: admin!.smtpPass!,
      },
    })

    // Verify connection
    console.log('Verifying SMTP connection...')
    await transporter.verify()
    console.log('✓ SMTP connection verified')

    // Send test email
    console.log(`\nSending test email to: ${testEmail}`)
    const info = await transporter.sendMail({
      from: `"${admin!.smtpFromName || 'NotaBener'}" <${admin!.smtpFromEmail}>`,
      to: testEmail,
      subject: 'Test Email dari NotaBener',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #276874;">Test Email Berhasil!</h2>
          <p>Email ini dikirim dari sistem NotaBener untuk menguji konfigurasi SMTP.</p>
          <p>Waktu pengiriman: ${new Date().toLocaleString('id-ID')}</p>
        </div>
      `,
    })

    console.log('✓ Email sent successfully!')
    console.log('Message ID:', info.messageId)

  } catch (error: any) {
    console.error('✗ Error sending email:', error.message)
  }

  await prisma.$disconnect()
}

testSendEmail().catch((e) => {
  console.error(e)
  process.exit(1)
})

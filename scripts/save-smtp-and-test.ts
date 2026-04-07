import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'

const prisma = new PrismaClient()

// Get password from command line argument
const smtpPassword = process.argv[2]

if (!smtpPassword) {
  console.error('Usage: npx ts-node scripts/save-smtp-and-test.ts <your-app-password>')
  console.error('\nGet your Gmail App Password from: https://myaccount.google.com/apppasswords')
  process.exit(1)
}

// SMTP Configuration
const SMTP_CONFIG = {
  smtpHost: 'smtp.gmail.com',
  smtpPort: '587',
  smtpSecure: false,
  smtpUser: 'hs.pramono@gmail.com',
  smtpPass: smtpPassword,
  smtpFromName: 'NotaBener',
  smtpFromEmail: 'hs.pramono@gmail.com',
}

async function saveSmtpAndTest() {
  const admin = await prisma.admins.findFirst()

  if (!admin) {
    console.error('No admin found in database')
    await prisma.$disconnect()
    return
  }

  console.log('=== Current Admin ===')
  console.log('ID:', admin.id)
  console.log('Email:', admin.email)

  // Check if password is provided
  if (!SMTP_CONFIG.smtpPass) {
    console.log('\n⚠️  ERROR: smtpPass is empty!')
    console.log('Please set your Gmail App Password in the script.')
    console.log('Get App Password from: https://myaccount.google.com/apppasswords')
    await prisma.$disconnect()
    return
  }

  // Save SMTP settings
  console.log('\n=== Saving SMTP Settings ===')
  await prisma.admins.update({
    where: { id: admin.id },
    data: {
      smtpHost: SMTP_CONFIG.smtpHost,
      smtpPort: SMTP_CONFIG.smtpPort,
      smtpSecure: SMTP_CONFIG.smtpSecure,
      smtpUser: SMTP_CONFIG.smtpUser,
      smtpPass: SMTP_CONFIG.smtpPass,
      smtpFromName: SMTP_CONFIG.smtpFromName,
      smtpFromEmail: SMTP_CONFIG.smtpFromEmail,
      updatedAt: new Date(),
    },
  })
  console.log('✓ SMTP settings saved to database')

  // Verify saved settings
  const saved = await prisma.admins.findUnique({
    where: { id: admin.id },
    select: {
      smtpHost: true,
      smtpPort: true,
      smtpSecure: true,
      smtpUser: true,
      smtpPass: true,
      smtpFromName: true,
      smtpFromEmail: true,
    },
  })
  console.log('\n=== Saved Settings ===')
  console.log('Host:', saved?.smtpHost)
  console.log('Port:', saved?.smtpPort)
  console.log('Secure:', saved?.smtpSecure)
  console.log('User:', saved?.smtpUser)
  console.log('Password:', saved?.smtpPass ? '[SET]' : 'NOT SET')
  console.log('From Name:', saved?.smtpFromName)
  console.log('From Email:', saved?.smtpFromEmail)

  // Test SMTP connection
  console.log('\n=== Testing SMTP Connection ===')
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_CONFIG.smtpHost,
      port: parseInt(SMTP_CONFIG.smtpPort),
      secure: SMTP_CONFIG.smtpSecure,
      auth: {
        user: SMTP_CONFIG.smtpUser,
        pass: SMTP_CONFIG.smtpPass,
      },
    })

    await transporter.verify()
    console.log('✓ SMTP connection verified')

    // Send test email
    console.log('\n=== Sending Test Email ===')
    const testEmail = 'hs.pramono@yahoo.com'
    console.log('To:', testEmail)

    const info = await transporter.sendMail({
      from: `"${SMTP_CONFIG.smtpFromName}" <${SMTP_CONFIG.smtpFromEmail}>`,
      to: testEmail,
      subject: 'Test Email dari NotaBener - SMTP Berhasil!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(145deg, #276874, #2d7d8a); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <img src="https://notabener.com/images/notabener-icon-admin.png" alt="NotaBener" width="48" height="48" style="border-radius: 12px;" />
            </div>
            <h1 style="color: #276874; margin: 0;">NotaBener</h1>
          </div>

          <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #276874; margin-top: 0;">✅ Test Email Berhasil!</h2>
            <p style="color: #334155; line-height: 1.6;">
              Email ini dikirim dari sistem NotaBener untuk menguji konfigurasi SMTP.
            </p>
            <div style="background: #f0fdf4; border: 2px solid #C5E151; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; color: #3f6212;">
                <strong>Waktu Pengiriman:</strong><br>
                ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
              </p>
            </div>
            <p style="color: #64748b; font-size: 14px;">
              Jika Anda menerima email ini, berarti konfigurasi SMTP sudah benar dan fitur forgot password siap digunakan.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 14px;">
            <p>Email ini dikirim dari sistem NotaBener</p>
          </div>
        </div>
      `,
    })

    console.log('✓ Email sent successfully!')
    console.log('Message ID:', info.messageId)
    console.log('\n🎉 Check your inbox at:', testEmail)

    transporter.close()

  } catch (error: any) {
    console.error('✗ Error:', error.message)
  }

  await prisma.$disconnect()
}

saveSmtpAndTest().catch(console.error)

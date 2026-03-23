import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'logos')

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
  }

  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Tipe file tidak didukung. Gunakan PNG, JPG, atau WebP.' },
      { status: 400 }
    )
  }

  // Validate file size (max 2MB)
  const maxSize = 2 * 1024 * 1024 // 2MB
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: 'Ukuran file terlalu besar. Maksimal 2MB.' },
      { status: 400 }
    )
  }

  // Generate unique filename
  const timestamp = Date.now().getTime()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const ext = file.name.split('.').pop() || 'png'
  const fileName = `logo-${timestamp}-${randomStr}.${ext}`
  const filePath = path.join(UPLOAD_DIR, fileName)

  // Convert file to buffer and save
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  fs.writeFileSync(filePath, buffer)

  // Return public URL
  const publicUrl = `/uploads/logos/${fileName}`

  return NextResponse.json({
    url: publicUrl,
    fileName: fileName,
  })
} catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Gagal mengupload file' },
      { status: 500 }
    )
  }
})

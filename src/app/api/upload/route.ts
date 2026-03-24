import { NextRequest, NextResponse } from 'next/server'
import { getUserSession } from '@/lib/session'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'logos')

function ensureUploadDir(): void {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true })
    }
  } catch (error) {
    console.error('[UPLOAD] Error creating directory:', error)
  }
}

ensureUploadDir()

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan' },
        { status: 400 }
      )
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipe file tidak didukung. Gunakan PNG, JPG, atau WebP.' },
        { status: 400 }
      )
    }

    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimal 2MB.' },
        { status: 400 }
      )
    }

    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `logo-${timestamp}-${randomStr}.${ext}`
    const filePath = join(UPLOAD_DIR, fileName)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    writeFileSync(filePath, buffer)

    console.log('[UPLOAD] File saved:', fileName)

    return NextResponse.json({
      url: `/uploads/logos/${fileName}`,
      fileName: fileName,
    })
  } catch (error) {
    console.error('[UPLOAD] Error:', error)
    return NextResponse.json(
      { error: 'Gagal mengupload file' },
      { status: 500 }
    )
  }
}

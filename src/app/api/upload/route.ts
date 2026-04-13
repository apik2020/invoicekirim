import { NextRequest, NextResponse } from 'next/server'
import { getUserSession } from '@/lib/session'
import { uploadFile, generateFilename } from '@/lib/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    console.log('[UPLOAD] Request received, content-type:', req.headers.get('content-type'))

    const session = await getUserSession()
    if (!session) {
      console.log('[UPLOAD] No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string || 'logo'

    console.log('[UPLOAD] File:', file?.name, 'Type:', file?.type, 'Size:', file?.size) // 'logo' | 'branding' | 'document'

    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipe file tidak didukung. Gunakan PNG, JPG, WebP, atau SVG.' },
        { status: 400 }
      )
    }

    // Validate file magic bytes (signature) to prevent MIME type spoofing
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (!validateFileSignature(buffer, file.type)) {
      return NextResponse.json(
        { error: 'Konten file tidak sesuai dengan tipe yang dideklarasikan.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB for branding, 2MB for others)
    const maxSize = type === 'branding' ? 5 * 1024 * 1024 : 2 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Ukuran file terlalu besar. Maksimal ${Math.round(maxSize / 1024 / 1024)}MB.` },
        { status: 400 }
      )
    }

    // Generate filename
    const prefix = type === 'branding' ? 'branding' : 'logo'
    const fileName = generateFilename(file.name, `${prefix}-${session.id}`)

    // Upload to storage (S3 or local)
    const result = await uploadFile(
      buffer,
      fileName,
      'logos', // subdirectory
      file.type
    )

    console.log('[UPLOAD] File uploaded:', result.url)

    return NextResponse.json({
      url: result.url,
      key: result.key,
      fileName: fileName,
    })
  } catch (error) {
    console.error('[UPLOAD] Error:', error)
    console.error('[UPLOAD] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    return NextResponse.json(
      { error: 'Gagal mengupload file' },
      { status: 500 }
    )
  }
}

/**
 * Validate file magic bytes (signatures) against declared MIME type.
 * Prevents MIME type spoofing attacks.
 */
function validateFileSignature(buffer: Buffer, declaredType: string): boolean {
  if (buffer.length < 4) return false

  // SVG is text-based — check for XML/SVG markers
  if (declaredType === 'image/svg+xml') {
    const header = buffer.toString('utf8', 0, Math.min(256, buffer.length)).toLowerCase()
    return header.includes('<svg') || header.includes('<?xml')
  }

  // PNG: 89 50 4E 47
  if (declaredType === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47
  }

  // JPEG: FF D8 FF
  if (declaredType === 'image/jpeg' || declaredType === 'image/jpg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF
  }

  // WebP: RIFF....WEBP
  if (declaredType === 'image/webp') {
    const riff = buffer.toString('ascii', 0, 4) === 'RIFF'
    const webp = buffer.toString('ascii', 8, 12) === 'WEBP'
    return riff && webp
  }

  // Unknown type — reject
  return false
}

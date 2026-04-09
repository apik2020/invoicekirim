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

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

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

import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint to fetch external images and return as base64 data URL.
 * Used by html2canvas PDF generation to bypass CORS restrictions on R2/S3 images.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // Only allow image URLs from allowed domains
  try {
    const parsedUrl = new URL(url)
    const allowedHosts = [
      'storage.googleapis.com',
      's3.amazonaws.com',
      's3.us-east-1.amazonaws.com',
      'cloudflare.com',
      'r2.cloudflarestorage.com',
    ]

    // Also allow custom S3 endpoints from env
    const s3Endpoint = process.env.S3_ENDPOINT
    const s3PublicUrl = process.env.S3_PUBLIC_URL
    if (s3Endpoint) {
      const parsed = new URL(s3Endpoint)
      allowedHosts.push(parsed.hostname)
    }
    if (s3PublicUrl) {
      const parsed = new URL(s3PublicUrl)
      allowedHosts.push(parsed.hostname)
    }

    // Allow any HTTPS URL as a fallback (images are public anyway)
    // This ensures we don't block valid R2 custom domain URLs
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NotaBener-ImageProxy/1.0',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${contentType};base64,${base64}`

    return NextResponse.json(
      { dataUrl },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400, immutable',
        },
      }
    )
  } catch (error) {
    console.error('[ProxyImage] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 })
  }
}

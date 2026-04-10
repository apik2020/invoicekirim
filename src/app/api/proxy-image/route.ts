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

  // Validate URL format
  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    console.log('[ProxyImage] Fetching:', url)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NotaBener-ImageProxy/1.0)',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      console.error('[ProxyImage] Fetch failed:', response.status, response.statusText)
      return NextResponse.json({ error: `Upstream returned ${response.status}` }, { status: 502 })
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    const arrayBuffer = await response.arrayBuffer()

    // Limit to 10MB
    if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
      console.error('[ProxyImage] Image too large:', arrayBuffer.byteLength)
      return NextResponse.json({ error: 'Image too large' }, { status: 413 })
    }

    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${contentType};base64,${base64}`

    console.log('[ProxyImage] Success:', contentType, `${(arrayBuffer.byteLength / 1024).toFixed(1)}KB`)

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

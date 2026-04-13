import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint to fetch external images and return as base64 data URL.
 * Used by html2canvas PDF generation to bypass CORS restrictions on R2/S3 images.
 */

// Blocked hostnames to prevent SSRF
const BLOCKED_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.169.254', // AWS/GCP metadata endpoint
  'metadata.google.internal',
  'metadata.internal',
]

// Private IP ranges
const PRIVATE_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^fd/,
  /^fc/,
  /^fe80:/,
  /^0\./,
]

function isPrivateOrBlockedHost(hostname: string): boolean {
  const lowerHost = hostname.toLowerCase()

  // Check blocked hostnames
  if (BLOCKED_HOSTNAMES.some(blocked => lowerHost === blocked || lowerHost.endsWith('.' + blocked))) {
    return true
  }

  // Check private IP ranges
  if (PRIVATE_IP_RANGES.some(regex => regex.test(lowerHost))) {
    return true
  }

  return false
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // Validate URL format
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // SSRF protection: block private/internal networks
  if (isPrivateOrBlockedHost(parsedUrl.hostname)) {
    console.warn('[ProxyImage] Blocked SSRF attempt:', parsedUrl.hostname)
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    console.log('[ProxyImage] Fetching:', url)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NotaBener-ImageProxy/1.0)',
      },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    })

    // SSRF protection: check if redirect landed on internal host
    const finalUrl = new URL(response.url)
    if (isPrivateOrBlockedHost(finalUrl.hostname)) {
      console.warn('[ProxyImage] Blocked SSRF after redirect:', finalUrl.hostname)
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!response.ok) {
      console.error('[ProxyImage] Fetch failed:', response.status, response.statusText)
      return NextResponse.json({ error: `Upstream returned ${response.status}` }, { status: 502 })
    }

    const contentType = response.headers.get('content-type') || 'image/png'

    // Only allow image content types
    if (!contentType.startsWith('image/')) {
      console.warn('[ProxyImage] Non-image content type:', contentType)
      return NextResponse.json({ error: 'Only image content types are allowed' }, { status: 400 })
    }

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

// Custom Next.js server for production with proper static file handling
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { existsSync, statSync, createReadStream } = require('fs')
const { join } = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = process.env.PORT || 3000

// Build version for cache busting
const CHUNK_VERSION = process.env.NEXT_PUBLIC_BUILD_ID || Date.now().toString()

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason)
})

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// MIME types for static files
const mimeTypes = {
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.html': 'text/html; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.map': 'application/json',
}

function getMimeType(path) {
  const ext = path.substring(path.lastIndexOf('.')).toLowerCase()
  return mimeTypes[ext] || 'application/octet-stream'
}

// Check if pathname is a page route (not static file)
function isPageRoute(pathname) {
  // Exclude static paths
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return false
  }
  // Exclude files with extensions (except .html)
  const lastDot = pathname.lastIndexOf('.')
  if (lastDot > pathname.lastIndexOf('/')) {
    const ext = pathname.substring(lastDot).toLowerCase()
    return ext === '.html'
  }
  return true
}

// Graceful shutdown
let server
const gracefulShutdown = (signal) => {
  console.log(`[Server] Received ${signal}, shutting down gracefully...`)
  if (server) {
    server.close(() => {
      console.log('[Server] HTTP server closed')
      process.exit(0)
    })
    setTimeout(() => {
      console.error('[Server] Forced shutdown after timeout')
      process.exit(1)
    }, 10000)
  } else {
    process.exit(0)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

app.prepare()
  .then(() => {
    console.log('[Server] Next.js app prepared')
    console.log('[Server] Build ID:', CHUNK_VERSION)

    server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true)
        const { pathname } = parsedUrl

        // Handle _next/static files with explicit MIME types
        if (pathname.startsWith('/_next/static/')) {
          const filePath = join(__dirname, pathname)

          if (existsSync(filePath) && statSync(filePath).isFile()) {
            const mimeType = getMimeType(pathname)

            // Set headers for static chunks
            res.setHeader('Content-Type', mimeType)
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
            res.setHeader('X-Content-Type-Options', 'nosniff')

            // Stream file
            const fileStream = createReadStream(filePath)
            fileStream.on('error', (err) => {
              console.error('[Server] File stream error:', err)
              res.statusCode = 500
              res.end('Internal server error')
            })
            fileStream.pipe(res)
            return
          } else {
            // Chunk file not found - return 404 with correct MIME type
            console.log('[Server] Chunk not found (stale cache):', pathname)
            res.statusCode = 404
            res.setHeader('Content-Type', 'text/plain; charset=utf-8')
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
            res.setHeader('X-Chunk-Error', 'stale-reference')
            res.end('Chunk not found - please refresh')
            return
          }
        }

        // Handle public folder files
        if (!pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
          const publicPath = join(__dirname, 'public', pathname)

          if (existsSync(publicPath) && statSync(publicPath).isFile()) {
            const mimeType = getMimeType(pathname)

            res.setHeader('Content-Type', mimeType)
            res.setHeader('Cache-Control', 'public, max-age=86400')
            res.setHeader('X-Content-Type-Options', 'nosniff')

            const fileStream = createReadStream(publicPath)
            fileStream.on('error', (err) => {
              console.error('[Server] Public file stream error:', err)
              res.statusCode = 500
              res.end('Internal server error')
            })
            fileStream.pipe(res)
            return
          }
        }

        // Set aggressive no-cache headers for ALL page routes
        if (isPageRoute(pathname)) {
          // Standard no-cache headers
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
          res.setHeader('Pragma', 'no-cache')
          res.setHeader('Expires', '0')

          // CDN/Proxy no-cache headers
          res.setHeader('Surrogate-Control', 'no-store')
          res.setHeader('CDN-Cache-Control', 'no-store')

          // Security headers
          res.setHeader('X-Content-Type-Options', 'nosniff')

          // Build version for debugging
          res.setHeader('X-Build-ID', CHUNK_VERSION)
        }

        // Let Next.js handle the request
        await handle(req, res, parsedUrl)
      } catch (err) {
        console.error('[Server] Error handling request:', req.url, err)
        res.statusCode = 500
        res.end('Internal server error')
      }
    })

    server.on('error', (err) => {
      console.error('[Server] HTTP server error:', err)
    })

    server.listen(port, () => {
      console.log(`[Server] Ready on http://${hostname}:${port}`)
    })
  })
  .catch((err) => {
    console.error('[Server] Failed to prepare Next.js app:', err)
    process.exit(1)
  })

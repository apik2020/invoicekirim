// Custom Next.js server for production with proper static file handling
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { existsSync, statSync, createReadStream } = require('fs')
const { join } = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = process.env.PORT || 3000

// Environment variable to force hard refresh on chunk errors
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
}

function getMimeType(path) {
  const ext = path.substring(path.lastIndexOf('.')).toLowerCase()
  return mimeTypes[ext] || 'application/octet-stream'
}

// Routes that should never be cached (to prevent stale chunk references)
const noCacheRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/checkout',
  '/dashboard',
  '/admin',
  '/client',
  '/invoice',
  '/payment',
  '/billing',
  '/settings',
]

function shouldNotCache(pathname) {
  // Check if it's a page route (no file extension and not a static path)
  if (!pathname.includes('.') && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    return true
  }
  // Check known routes
  return noCacheRoutes.some(route => pathname.startsWith(route))
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

            // Set headers
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
            // Chunk file not found - this happens when old cached HTML references old chunks
            // Return a proper 404 with correct headers to prevent MIME type issues
            console.log('[Server] Chunk not found (likely old cached reference):', pathname)
            res.statusCode = 404
            res.setHeader('Content-Type', 'text/plain; charset=utf-8')
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
            res.end('Not found - please refresh the page')
            return
          }
        }

        // Handle public folder files
        if (!pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
          const publicPath = join(__dirname, 'public', pathname)

          if (existsSync(publicPath) && statSync(publicPath).isFile()) {
            const mimeType = getMimeType(pathname)

            res.setHeader('Content-Type', mimeType)
            res.setHeader('Cache-Control', 'public, max-age=86400') // 1 day for public assets

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

        // Set no-cache headers for HTML pages to prevent stale chunk references
        if (shouldNotCache(pathname)) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
          res.setHeader('Pragma', 'no-cache')
          res.setHeader('Expires', '0')
          res.setHeader('X-Content-Type-Options', 'nosniff')
          // Add build ID header for debugging
          res.setHeader('X-Build-ID', CHUNK_VERSION)
        }

        // Let Next.js handle everything else
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

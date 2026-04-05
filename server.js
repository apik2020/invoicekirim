// Custom Next.js server for production with proper static file handling
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { existsSync, statSync, createReadStream } = require('fs')
const { join } = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = process.env.PORT || 3000

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
}

function getMimeType(path) {
  const ext = path.substring(path.lastIndexOf('.')).toLowerCase()
  return mimeTypes[ext] || 'application/octet-stream'
}

app.prepare().then(() => {
  createServer(async (req, res) => {
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
          fileStream.pipe(res)
          return
        }
      }

      // Handle public folder files
      if (!pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
        const publicPath = join(__dirname, 'public', pathname)

        if (existsSync(publicPath) && statSync(publicPath).isFile()) {
          const mimeType = getMimeType(pathname)

          res.setHeader('Content-Type', mimeType)
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

          const fileStream = createReadStream(publicPath)
          fileStream.pipe(res)
          return
        }
      }

      // Let Next.js handle everything else
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})

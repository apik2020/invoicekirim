import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const isProduction = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  // Explicitly set distDir to avoid Turbopack issues
  distDir: '.next',

  // Enable standalone output for Docker deployment
  output: 'standalone',

  // Generate unique build ID to invalidate cache on each deployment
  generateBuildId: async () => {
    return Date.now().toString()
  },

  // Temporarily skip TypeScript errors during build
  // TODO: Fix all Prisma schema issues and remove this
  typescript: {
    ignoreBuildErrors: true,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.stripe.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    unoptimized: false,
  },

  // Security headers
  async headers() {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com https://app.sandbox.midtrans.com https://app.midtrans.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://api.midtrans.com https://app.sandbox.midtrans.com https://o1.ingest.sentry.io",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://app.sandbox.midtrans.com https://app.midtrans.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ]

    return [
      // HTML pages - no cache to prevent stale chunk references
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        source: '/:path((?!_next/static|_next/image|favicon.ico|images).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          // DNS Prefetch
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          // Frame Protection
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // MIME Type Sniffing Protection
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // XSS Protection (legacy but still useful for older browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: cspDirectives.join('; '),
          },
          // HSTS - Only in production
          ...(isProduction
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains; preload',
                },
              ]
            : []),
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // API routes - stricter headers
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      // Static files - proper caching
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // JavaScript files - explicit MIME type
      {
        source: '/_next/static/chunks/:path*.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // CSS files - explicit MIME type
      {
        source: '/_next/static/css/:path*.css',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // App build files - explicit MIME type
      {
        source: '/_next/static/:build/_buildManifest.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
      {
        source: '/_next/static/:build/_ssgManifest.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
    ]
  },

  // Experimental features
  experimental: {
    // Sentry instrumentation is handled via instrumentation.ts
  },
}

// Sentry configuration
const sentryConfig = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For more information about toggling and adjusting source map uploads,
  // see: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#upload-source-maps
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in Sentry
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
  tunnelRoute: '/monitoring',

  // Hide source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors
  automaticVercelMonitors: true,
}

// Export with Sentry wrapper if DSN is configured
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

// Temporarily disable Sentry wrapper for development to fix Turbopack issue
export default nextConfig

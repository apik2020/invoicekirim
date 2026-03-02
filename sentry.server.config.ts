import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: !!SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  // Ignore specific errors
  ignoreErrors: [
    // Common non-critical errors
    'Non-Error promise rejection captured',
    'Network request failed',
    'Failed to fetch',
    'NetworkError',
    // Next.js specific
    'Load failed',
    'cancelled',
  ],

  // Filter out transactions for health checks and webhooks
  tracesSampler: (samplingContext) => {
    const url = samplingContext.request?.url

    if (!url) return 0.1

    // Don't trace health checks
    if (url.includes('/api/health')) {
      return 0
    }

    // Lower sampling for webhooks
    if (url.includes('/api/webhooks')) {
      return 0.01
    }

    // Higher sampling for critical paths
    if (url.includes('/api/invoices') || url.includes('/api/payments')) {
      return 0.3
    }

    return process.env.NODE_ENV === 'production' ? 0.1 : 1.0
  },

  // Add Prisma integration for database query tracing
  integrations: [
    Sentry.prismaIntegration(),
  ],
})

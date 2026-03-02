import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: !!SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.feedbackIntegration({
      // Additional feedback configuration
      colorScheme: 'system',
      isEmailRequired: true,
    }),
  ],

  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    'Non-Error promise rejection captured',
    'Network request failed',
    'Failed to fetch',
    'NetworkError',
    // Next.js specific
    'Load failed',
    'cancelled',
    // Common non-critical errors
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Script error.',
  ],

  // Filter out transactions for health checks
  tracesSampler: (samplingContext) => {
    if (samplingContext.request?.url?.includes('/api/health')) {
      return 0
    }
    return process.env.NODE_ENV === 'production' ? 0.1 : 1.0
  },
})

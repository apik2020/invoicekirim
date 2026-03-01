/**
 * Environment Variable Validation
 * Validates all required environment variables at startup
 */

type EnvVar = {
  name: string
  required: boolean
  description: string
  default?: string
  validate?: (value: string) => boolean
  deprecated?: boolean
}

// Define all environment variables used in the application
const ENV_VARS: EnvVar[] = [
  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL database connection URL',
    validate: (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
  },

  // NextAuth
  {
    name: 'NEXTAUTH_URL',
    required: true,
    description: 'The canonical URL of your application',
    validate: (value) => value.startsWith('http://') || value.startsWith('https://'),
  },
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    description: 'Secret key for NextAuth.js JWT encryption (generate with: openssl rand -base64 32)',
    validate: (value) => value.length >= 32,
  },

  // App URL
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: true,
    description: 'Public URL of your application',
    validate: (value) => value.startsWith('http://') || value.startsWith('https://'),
  },

  // Stripe (optional - only required if using Stripe)
  {
    name: 'STRIPE_SECRET_KEY',
    required: false,
    description: 'Stripe secret API key (sk_test_... or sk_live_...)',
    validate: (value) => value.startsWith('sk_test_') || value.startsWith('sk_live_'),
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: false,
    description: 'Stripe webhook signing secret (whsec_...)',
    validate: (value) => value.startsWith('whsec_'),
  },
  {
    name: 'STRIPE_PRO_PRICE_ID',
    required: false,
    description: 'Stripe price ID for PRO subscription',
    validate: (value) => value.startsWith('price_'),
  },

  // Google OAuth (optional - only required if using Google login)
  {
    name: 'GOOGLE_CLIENT_ID',
    required: false,
    description: 'Google OAuth client ID',
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    required: false,
    description: 'Google OAuth client secret',
  },

  // Email (optional - Resend)
  {
    name: 'RESEND_API_KEY',
    required: false,
    description: 'Resend API key for sending emails (re_...)',
    validate: (value) => value.startsWith('re_'),
  },

  // Cron Job Security
  {
    name: 'CRON_SECRET',
    required: false,
    description: 'Secret key to secure cron job endpoints',
  },

  // Rate Limiting (Upstash Redis)
  {
    name: 'UPSTASH_REDIS_REST_URL',
    required: false,
    description: 'Upstash Redis REST URL for rate limiting',
  },
  {
    name: 'UPSTASH_REDIS_REST_TOKEN',
    required: false,
    description: 'Upstash Redis REST token',
  },

  // Midtrans (optional - Indonesian payment gateway)
  {
    name: 'MIDTRANS_SERVER_KEY',
    required: false,
    description: 'Midtrans server key',
  },
  {
    name: 'MIDTRANS_CLIENT_KEY',
    required: false,
    description: 'Midtrans client key',
  },
]

interface EnvValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  missing: string[]
}

/**
 * Validate environment variables
 */
export function validateEnv(): EnvValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const missing: string[] = []

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name]

    // Check if required variable is missing
    if (envVar.required && !value) {
      errors.push(`Missing required env var: ${envVar.name} - ${envVar.description}`)
      missing.push(envVar.name)
      continue
    }

    // Skip validation if not set and not required
    if (!value) {
      continue
    }

    // Check deprecation
    if (envVar.deprecated) {
      warnings.push(`Deprecated env var used: ${envVar.name} - ${envVar.description}`)
    }

    // Validate format
    if (envVar.validate && !envVar.validate(value)) {
      errors.push(`Invalid format for ${envVar.name}: ${envVar.description}`)
    }
  }

  // Check for common configuration issues
  const nodeEnv = process.env.NODE_ENV
  const isProduction = nodeEnv === 'production'

  if (isProduction) {
    // Production-specific checks
    if (process.env.NEXTAUTH_URL?.includes('localhost')) {
      errors.push('NEXTAUTH_URL should not be localhost in production')
    }
    if (process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')) {
      errors.push('NEXT_PUBLIC_APP_URL should not be localhost in production')
    }
    if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
      warnings.push('Using Stripe test key in production environment')
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      warnings.push('STRIPE_WEBHOOK_SECRET not set - Stripe webhooks may not work')
    }
    if (!process.env.CRON_SECRET) {
      warnings.push('CRON_SECRET not set - Cron endpoints are not secured')
    }
  }

  // Check for OAuth configuration completeness
  const hasGoogleClientId = !!process.env.GOOGLE_CLIENT_ID
  const hasGoogleClientSecret = !!process.env.GOOGLE_CLIENT_SECRET
  if (hasGoogleClientId && !hasGoogleClientSecret) {
    errors.push('GOOGLE_CLIENT_ID is set but GOOGLE_CLIENT_SECRET is missing')
  }
  if (!hasGoogleClientId && hasGoogleClientSecret) {
    warnings.push('GOOGLE_CLIENT_SECRET is set but GOOGLE_CLIENT_ID is missing')
  }

  // Check Stripe configuration completeness
  const hasStripeKey = !!process.env.STRIPE_SECRET_KEY
  const hasStripeWebhook = !!process.env.STRIPE_WEBHOOK_SECRET
  const hasStripePrice = !!process.env.STRIPE_PRO_PRICE_ID
  if (hasStripeKey && (!hasStripeWebhook || !hasStripePrice)) {
    warnings.push('Stripe is partially configured - some features may not work')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missing,
  }
}

/**
 * Get validated environment variable
 * Throws error if required and missing
 */
export function getEnvVar(name: string, required: boolean = true): string | undefined {
  const value = process.env[name]

  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

/**
 * Get environment variable with default value
 */
export function getEnvVarOrDefault(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue
}

/**
 * Check if we're in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if we're in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Log environment validation results
 */
export function logEnvValidation(result: EnvValidationResult): void {
  if (result.errors.length > 0) {
    console.error('\n❌ Environment Variable Errors:')
    result.errors.forEach((error) => console.error(`   - ${error}`))
  }

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Variable Warnings:')
    result.warnings.forEach((warning) => console.warn(`   - ${warning}`))
  }

  if (result.valid) {
    console.log('✅ Environment variables validated successfully')
  } else {
    console.error('\n❌ Please fix the environment variable errors before starting the application')
  }
}

// Run validation on import in non-test environments
if (process.env.NODE_ENV !== 'test') {
  const result = validateEnv()
  if (!result.valid) {
    logEnvValidation(result)
    // Only throw in production or if explicitly requested
    if (isProduction() || process.env.STRICT_ENV_CHECK === 'true') {
      throw new Error('Environment validation failed')
    }
  } else if (result.warnings.length > 0) {
    logEnvValidation(result)
  }
}

// Export validated env object for convenience
export const env = {
  // Database
  databaseUrl: process.env.DATABASE_URL,

  // NextAuth
  nextAuthUrl: process.env.NEXTAUTH_URL,
  nextAuthSecret: process.env.NEXTAUTH_SECRET,

  // App
  appUrl: process.env.NEXT_PUBLIC_APP_URL,

  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  stripeProPriceId: process.env.STRIPE_PRO_PRICE_ID,

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,

  // Email
  resendApiKey: process.env.RESEND_API_KEY,

  // Security
  cronSecret: process.env.CRON_SECRET,

  // Rate Limiting
  upstashRedisUrl: process.env.UPSTASH_REDIS_REST_URL,
  upstashRedisToken: process.env.UPSTASH_REDIS_REST_TOKEN,

  // Midtrans
  midtransServerKey: process.env.MIDTRANS_SERVER_KEY,
  midtransClientKey: process.env.MIDTRANS_CLIENT_KEY,
  midtransIsProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',

  // Environment
  nodeEnv: process.env.NODE_ENV,
  isProduction: isProduction(),
  isDevelopment: isDevelopment(),
} as const

#!/usr/bin/env ts-node

/**
 * Environment Variable Validation Script
 * Run this script to validate your environment configuration
 *
 * Usage: npx ts-node scripts/validate-env.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

// Define all environment variables
const ENV_VARS = [
  // Required
  { name: 'DATABASE_URL', required: true, description: 'PostgreSQL connection URL' },
  { name: 'NEXTAUTH_URL', required: true, description: 'Application URL for NextAuth' },
  { name: 'NEXTAUTH_SECRET', required: true, description: 'Secret for JWT encryption' },
  { name: 'NEXT_PUBLIC_APP_URL', required: true, description: 'Public application URL' },

  // Optional - Stripe
  { name: 'STRIPE_SECRET_KEY', required: false, description: 'Stripe API key' },
  { name: 'STRIPE_WEBHOOK_SECRET', required: false, description: 'Stripe webhook secret' },
  { name: 'STRIPE_PRO_PRICE_ID', required: false, description: 'Stripe PRO price ID' },

  // Optional - OAuth
  { name: 'GOOGLE_CLIENT_ID', required: false, description: 'Google OAuth client ID' },
  { name: 'GOOGLE_CLIENT_SECRET', required: false, description: 'Google OAuth client secret' },

  // Optional - Email
  { name: 'RESEND_API_KEY', required: false, description: 'Resend API key for emails' },

  // Optional - Security
  { name: 'CRON_SECRET', required: false, description: 'Secret for cron endpoints' },

  // Optional - Rate Limiting
  { name: 'UPSTASH_REDIS_REST_URL', required: false, description: 'Upstash Redis URL' },
  { name: 'UPSTASH_REDIS_REST_TOKEN', required: false, description: 'Upstash Redis token' },

  // Optional - Midtrans
  { name: 'MIDTRANS_SERVER_KEY', required: false, description: 'Midtrans server key' },
  { name: 'MIDTRANS_CLIENT_KEY', required: false, description: 'Midtrans client key' },
]

console.log('\n🔍 Validating Environment Variables...\n')
console.log('=' .repeat(50))

let hasErrors = false
let hasWarnings = false
const missing: string[] = []
const errors: string[] = []
const warnings: string[] = []

for (const envVar of ENV_VARS) {
  const value = process.env[envVar.name]
  const status = value ? '✅' : (envVar.required ? '❌' : '⚠️')

  if (!value && envVar.required) {
    hasErrors = true
    missing.push(envVar.name)
    errors.push(`Missing required: ${envVar.name}`)
  } else if (!value && !envVar.required) {
    hasWarnings = true
    warnings.push(`Not set (optional): ${envVar.name}`)
  }

  // Mask sensitive values
  const displayValue = value
    ? (envVar.name.includes('SECRET') || envVar.name.includes('KEY') || envVar.name.includes('PASSWORD')
        ? `${value.substring(0, 8)}...`
        : value)
    : 'not set'

  console.log(`${status} ${envVar.name}`)
  console.log(`   Description: ${envVar.description}`)
  console.log(`   Value: ${displayValue}`)
  console.log(`   Required: ${envVar.required ? 'Yes' : 'No'}`)
  console.log('')
}

console.log('=' .repeat(50))
console.log('\n📋 Validation Summary:\n')

if (errors.length > 0) {
  console.log('❌ Errors:')
  errors.forEach(e => console.log(`   - ${e}`))
  console.log('')
}

if (warnings.length > 0) {
  console.log('⚠️  Warnings:')
  warnings.forEach(w => console.log(`   - ${w}`))
  console.log('')
}

if (!hasErrors && !hasWarnings) {
  console.log('✅ All environment variables are properly configured!\n')
} else if (!hasErrors) {
  console.log('✅ All required environment variables are set.')
  console.log('⚠️  Some optional variables are not configured.\n')
} else {
  console.log('❌ Please fix the errors above before deploying.\n')
  process.exit(1)
}

// Check for common issues
console.log('=' .repeat(50))
console.log('\n🔧 Configuration Tips:\n')

const nodeEnv = process.env.NODE_ENV || 'development'
const isProduction = nodeEnv === 'production'

if (isProduction) {
  if (process.env.NEXTAUTH_URL?.includes('localhost')) {
    console.log('⚠️  NEXTAUTH_URL should not be localhost in production')
  }
  if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
    console.log('⚠️  Using Stripe test key in production')
  }
  if (!process.env.CRON_SECRET) {
    console.log('⚠️  CRON_SECRET not set - cron endpoints are not secured')
  }
}

// Check OAuth configuration
if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_SECRET) {
  console.log('⚠️  GOOGLE_CLIENT_ID set but GOOGLE_CLIENT_SECRET missing')
}
if (!process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('⚠️  GOOGLE_CLIENT_SECRET set but GOOGLE_CLIENT_ID missing')
}

// Check Stripe configuration
if (process.env.STRIPE_SECRET_KEY) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.log('⚠️  Stripe key set but STRIPE_WEBHOOK_SECRET missing')
  }
  if (!process.env.STRIPE_PRO_PRICE_ID) {
    console.log('⚠️  Stripe key set but STRIPE_PRO_PRICE_ID missing')
  }
}

console.log('\n✨ Validation complete!\n')

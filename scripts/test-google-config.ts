import { env } from '../src/lib/env'

console.log('=== Google OAuth Configuration Check ===\n')

if (env.googleClientId) {
  console.log('✅ GOOGLE_CLIENT_ID is loaded')
  console.log(`   Value: ${env.googleClientId.substring(0, 10)}...`)
} else {
  console.log('❌ GOOGLE_CLIENT_ID is NOT loaded')
}

if (env.googleClientSecret) {
  console.log('✅ GOOGLE_CLIENT_SECRET is loaded')
  console.log(`   Length: ${env.googleClientSecret.length} characters`)
} else {
  console.log('❌ GOOGLE_CLIENT_SECRET is NOT loaded')
}

console.log('\n=== Required Configuration in Google Cloud Console ===')
console.log('Authorized JavaScript origins:')
console.log('  - http://localhost:3000')
console.log('\nAuthorized redirect URIs:')
console.log('  - http://localhost:3000/api/auth/callback/google')

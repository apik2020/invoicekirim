#!/usr/bin/env npx ts-node

/**
 * DOKU RSA Key Generator
 *
 * This script generates RSA key pairs required for DOKU SNAP API integration.
 *
 * After generating the keys:
 * 1. Copy the PRIVATE_KEY to your .env file as DOKU_PRIVATE_KEY
 * 2. Copy the PUBLIC_KEY to your .env file as DOKU_PUBLIC_KEY
 * 3. Upload the PUBLIC_KEY content to your DOKU Dashboard (Settings > Integration)
 * 4. Get DOKU's public key from DOKU Dashboard and add it as DOKU_PUBLIC_KEY_DOKU
 */

import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

function generateRSAKeyPair() {
  console.log('🔑 DOKU RSA Key Generator\n')
  console.log('=' .repeat(60))
  console.log()

  // Generate RSA key pair
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  })

  console.log('✅ RSA Key Pair Generated Successfully!\n')

  console.log('=' .repeat(60))
  console.log('📋 PRIVATE KEY (Add to .env as DOKU_PRIVATE_KEY)')
  console.log('=' .repeat(60))
  console.log()
  console.log('DOKU_PRIVATE_KEY="' + privateKey.replace(/\n/g, '\\n') + '"')
  console.log()

  console.log('=' .repeat(60))
  console.log('📋 PUBLIC KEY (Add to .env as DOKU_PUBLIC_KEY)')
  console.log('=' .repeat(60))
  console.log()
  console.log('DOKU_PUBLIC_KEY="' + publicKey.replace(/\n/g, '\\n') + '"')
  console.log()

  console.log('=' .repeat(60))
  console.log('📝 Next Steps:')
  console.log('=' .repeat(60))
  console.log()
  console.log('1. Copy the PRIVATE_KEY above to your .env file:')
  console.log('   DOKU_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."')
  console.log()
  console.log('2. Copy the PUBLIC_KEY above to your .env file:')
  console.log('   DOKU_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----..."')
  console.log()
  console.log('3. Upload the PUBLIC KEY to your DOKU Dashboard:')
  console.log('   - Go to Settings > Integration')
  console.log('   - Paste the public key (without quotes and \\n)')
  console.log('   - Save changes')
  console.log()
  console.log('4. Get DOKU\'s public key from DOKU Dashboard:')
  console.log('   - Go to Settings > Integration')
  console.log('   - Copy DOKU\'s public key')
  console.log('   - Add to .env as DOKU_PUBLIC_KEY_DOKU')
  console.log()
  console.log('5. Optional: Set your Partner Service ID:')
  console.log('   DOKU_PARTNER_SERVICE_ID="your_partner_service_id"')
  console.log()

  // Save keys to files for convenience
  const keysDir = path.join(process.cwd(), 'doku-keys')
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true })
  }

  fs.writeFileSync(path.join(keysDir, 'private.key'), privateKey)
  fs.writeFileSync(path.join(keysDir, 'public.key'), publicKey)

  console.log('=' .repeat(60))
  console.log('💾 Keys also saved to ./doku-keys/ directory')
  console.log('=' .repeat(60))
  console.log()
  console.log('   ./doku-keys/private.key')
  console.log('   ./doku-keys/public.key')
  console.log()
  console.log('⚠️  IMPORTANT: Add doku-keys/ to .gitignore!')
  console.log()

  // Add to .gitignore
  const gitignorePath = path.join(process.cwd(), '.gitignore')
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8')
    if (!gitignore.includes('doku-keys/')) {
      fs.appendFileSync(gitignorePath, '\n# DOKU Keys\ndoku-keys/\n')
      console.log('✅ Added doku-keys/ to .gitignore')
    }
  }

  console.log()
  console.log('🎉 Done! Configure the keys in your .env file and DOKU Dashboard.')
}

// Run the generator
generateRSAKeyPair()

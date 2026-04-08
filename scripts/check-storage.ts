/**
 * Storage Configuration Check Script
 * Run: npx tsx scripts/check-storage.ts
 */

import { S3Client, ListBucketsCommand,
  CreateBucketCommand,
  PutObjectCommand,
  HeadBucketCommand } from '@aws-sdk/client-s3'

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local'
const S3_ENDPOINT = process.env.S3_ENDPOINT || ''
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || ''
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || ''
const S3_BUCKET = process.env.S3_BUCKET || 'notabener'
const S3_REGION = process.env.S3_REGION || 'us-east-1'

async function checkStorage() {
  console.log('========================================')
  console.log(' Storage Configuration Check')
  console.log('========================================')
  console.log(`Storage Type: ${STORAGE_TYPE}`)

  if (STORAGE_TYPE !== 's3') {
    console.log('Using local filesystem storage (development mode)')
    console.log('Files will be stored in: ./public/uploads/')
    return
  }

  if (!S3_ENDPOINT || !S3_ACCESS_KEY || !S3_SECRET_KEY) {
    console.error('Missing S3 configuration:')
    console.error(`  S3_ENDPOINT: ${S3_ENDPOINT || 'NOT SET'}`)
    console.error(`  S3_ACCESS_KEY: ${S3_ACCESS_KEY ? '***' + S3_ACCESS_KEY.slice(-4) : 'NOT SET'}`)
    console.error(`  S3_SECRET_KEY: ${S3_SECRET_KEY ? '***' + S3_SECRET_KEY.slice(-4) : 'NOT SET'}`)
    process.exit(1)
  }

  console.log(`S3 Endpoint: ${S3_ENDPOINT}`)
  console.log(`S3 Bucket: ${S3_BUCKET}`)
  console.log(`S3 Region: ${S3_REGION}`)

  try {
    const client = new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
      },
      forcePathStyle: true,
    })

    console.log('\nTesting connection...')

    // Try to list buckets
    const listBuckets = await client.send(new ListBucketsCommand({}))
    console.log(`Available buckets: ${listBuckets.Buckets?.map(b => b.Name).join(', ') || 'none'}`)

    // Check if our bucket exists
    try {
      await client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }))
      console.log(`Bucket "${S3_BUCKET}" exists`)
    } catch (error: any) {
      console.log(`Bucket "${S3_BUCKET}" not found, creating...`)
      await client.send(new CreateBucketCommand({ Bucket: S3_BUCKET }))
      console.log(`Bucket "${S3_BUCKET}" created successfully`)
    }

    // Test upload
    console.log('\nTesting upload...')
    const testKey = `test/test-${Date.now()}.txt`
    await client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: testKey,
      Body: 'Test file from NotaBener',
      ContentType: 'text/plain',
    }))
    console.log(`Test file uploaded: ${testKey}`)

    console.log('\n========================================')
    console.log(' Storage configuration OK!')
    console.log('========================================')

  } catch (error: any) {
    console.error('\n========================================')
    console.error(' Storage configuration FAILED!')
    console.error('========================================')
    console.error(`Error: ${error.message}`)
    console.error('\nPossible causes:')
    console.error('- MinIO server is not running')
    console.error('- Wrong endpoint URL')
    console.error('- Invalid credentials')
    console.error('- Bucket does not exist and cannot be created')
    process.exit(1)
  }
}

checkStorage()

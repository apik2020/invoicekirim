/**
 * Storage Utility - Supports S3-compatible storage (Cloudflare R2, AWS S3, etc.)
 * Falls back to local filesystem for development
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { writeFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'

// Configuration
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local' // 'local' | 's3'
const S3_ENDPOINT = process.env.S3_ENDPOINT || ''
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || ''
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || ''
const S3_BUCKET = process.env.S3_BUCKET || 'notabener'
const S3_REGION = process.env.S3_REGION || 'us-east-1'
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || ''

// Local storage paths
const LOCAL_UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

// S3 Client (lazy initialization)
let s3Client: S3Client | null = null

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
      },
      forcePathStyle: false, // Cloudflare R2 uses virtual-hosted-style
    })
  }
  return s3Client
}

/**
 * Ensure local upload directory exists
 */
function ensureLocalDir(subdir: string): string {
  const dir = join(LOCAL_UPLOAD_DIR, subdir)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

/**
 * Upload a file to storage
 * @param buffer - File buffer
 * @param filename - Target filename
 * @param subdir - Subdirectory (e.g., 'logos', 'invoices')
 * @param contentType - MIME type
 * @returns URL to access the file
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  subdir: string,
  contentType: string = 'application/octet-stream'
): Promise<{ url: string; key: string }> {
  const key = `${subdir}/${filename}`

  if (STORAGE_TYPE === 's3' && S3_ENDPOINT) {
    // Upload to S3-compatible storage
    const client = getS3Client()

    await client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    )

    // Construct public URL
    const url = S3_PUBLIC_URL
      ? `${S3_PUBLIC_URL}/${key}`
      : `${S3_ENDPOINT}/${S3_BUCKET}/${key}`

    console.log('[Storage] File uploaded to S3:', key)
    return { url, key }
  } else {
    // Fallback to local filesystem
    const dir = ensureLocalDir(subdir)
    const filePath = join(dir, filename)
    writeFileSync(filePath, buffer)

    const url = `/uploads/${key}`
    console.log('[Storage] File saved locally:', key)
    return { url, key }
  }
}

/**
 * Get a signed URL for temporary access (S3 only)
 * @param key - File key
 * @param expiresIn - URL expiration in seconds (default: 3600)
 */
export async function getSignedFileUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string | null> {
  if (STORAGE_TYPE !== 's3' || !S3_ENDPOINT) {
    // For local storage, return the public URL
    return `/uploads/${key}`
  }

  try {
    const client = getS3Client()
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    })
    return await getSignedUrl(client, command, { expiresIn })
  } catch (error) {
    console.error('[Storage] Error getting signed URL:', error)
    return null
  }
}

/**
 * Delete a file from storage
 * @param key - File key (e.g., 'logos/abc123.png')
 */
export async function deleteFile(key: string): Promise<boolean> {
  try {
    if (STORAGE_TYPE === 's3' && S3_ENDPOINT) {
      const client = getS3Client()
      await client.send(
        new DeleteObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
        })
      )
      console.log('[Storage] File deleted from S3:', key)
    } else {
      const filePath = join(LOCAL_UPLOAD_DIR, key)
      if (existsSync(filePath)) {
        unlinkSync(filePath)
        console.log('[Storage] File deleted locally:', key)
      }
    }
    return true
  } catch (error) {
    console.error('[Storage] Error deleting file:', error)
    return false
  }
}

/**
 * Get storage configuration info
 */
export function getStorageConfig() {
  return {
    type: STORAGE_TYPE,
    isConfigured: STORAGE_TYPE === 's3' ? !!(S3_ENDPOINT && S3_ACCESS_KEY && S3_SECRET_KEY) : true,
    bucket: S3_BUCKET,
    endpoint: STORAGE_TYPE === 's3' ? S3_ENDPOINT : 'local',
  }
}

/**
 * Generate a unique filename
 */
export function generateFilename(originalName: string, prefix: string = 'file'): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const ext = originalName.split('.').pop() || 'bin'
  return `${prefix}-${timestamp}-${randomStr}.${ext}`
}

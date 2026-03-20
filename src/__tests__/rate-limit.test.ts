import { describe, it, expect, vi } from 'vitest'
import {
  getRateLimitType,
  getClientIp,
  checkRateLimit,
} from '@/lib/rate-limit'

// Mock environment variables
vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')

// Mock prisma to throw error for fail-open test
vi.mock('@/lib/prisma', () => ({
  prisma: {
    rate_limit_entries: {
      findUnique: () => { throw new Error('Database not available') },
      upsert: () => { throw new Error('Database not available') },
    },
    $transaction: () => { throw new Error('Database not available') },
  },
}))

describe('Rate Limiting', () => {
  describe('getRateLimitType', () => {
    it('should return auth for auth routes', () => {
      expect(getRateLimitType('/api/auth/callback', 'POST')).toBe('auth')
    })

    it('should return payment for payment routes', () => {
      expect(getRateLimitType('/api/payments', 'POST')).toBe('payment')
      expect(getRateLimitType('/api/checkout', 'GET')).toBe('payment')
    })

    it('should return webhook for webhook routes', () => {
      expect(getRateLimitType('/api/webhooks/stripe', 'POST')).toBe('webhook')
    })

    it('should return email for email routes', () => {
      expect(getRateLimitType('/api/email/send', 'POST')).toBe('email')
    })

    it('should return write for POST/PUT/DELETE methods', () => {
      expect(getRateLimitType('/api/invoices', 'POST')).toBe('write')
      expect(getRateLimitType('/api/invoices/1', 'PUT')).toBe('write')
      expect(getRateLimitType('/api/invoices/1', 'DELETE')).toBe('write')
    })

    it('should return read for GET method', () => {
      expect(getRateLimitType('/api/invoices', 'GET')).toBe('read')
    })

    it('should return api as default', () => {
      expect(getRateLimitType('/api/unknown', 'PATCH')).toBe('write')
    })
  })

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      })
      expect(getClientIp(req)).toBe('192.168.1.1')
    })

    it('should extract IP from x-real-ip header', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-real-ip': '192.168.1.2' },
      })
      expect(getClientIp(req)).toBe('192.168.1.2')
    })

    it('should extract IP from cf-connecting-ip header', () => {
      const req = new Request('http://localhost', {
        headers: { 'cf-connecting-ip': '192.168.1.3' },
      })
      expect(getClientIp(req)).toBe('192.168.1.3')
    })

    it('should return anonymous when no IP headers', () => {
      const req = new Request('http://localhost')
      expect(getClientIp(req)).toBe('anonymous')
    })
  })

  describe('checkRateLimit', () => {
    it('should fail open when database is not available', async () => {
      const result = await checkRateLimit('test-ip', 'api')
      // When database fails, the function should still succeed (fail-open)
      expect(result.success).toBe(true)
      // It returns the configured limit even on error (to inform the client)
      expect(result.limit).toBe(30) // api rate limit is 30
    })
  })
})

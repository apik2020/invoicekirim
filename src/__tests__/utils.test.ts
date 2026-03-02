import { describe, it, expect } from 'vitest'
import { cn, formatCurrency, formatDate, generateInvoiceNumber } from '@/lib/utils'

describe('Utils', () => {
  describe('cn (className merge)', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('should handle undefined and null', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
    })

    it('should merge tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })
  })

  describe('formatCurrency', () => {
    it('should format IDR currency', () => {
      const result = formatCurrency(1000000)
      expect(result).toContain('1.000.000')
      expect(result).toContain('Rp')
    })

    it('should handle zero', () => {
      const result = formatCurrency(0)
      expect(result).toContain('0')
    })

    it('should handle negative numbers', () => {
      const result = formatCurrency(-1000)
      expect(result).toContain('-')
    })
  })

  describe('formatDate', () => {
    it('should format date correctly in Indonesian locale', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date)
      expect(result).toContain('2024')
    })

    it('should handle string dates', () => {
      const result = formatDate('2024-01-15')
      expect(result).toContain('2024')
    })
  })

  describe('generateInvoiceNumber', () => {
    it('should generate invoice number with INV prefix', () => {
      const result = generateInvoiceNumber()
      expect(result).toMatch(/^INV-\d{9}$/)
    })

    it('should generate unique invoice numbers', () => {
      const numbers = new Set<string>()
      for (let i = 0; i < 100; i++) {
        numbers.add(generateInvoiceNumber())
      }
      // Most should be unique (some might collide due to random part)
      expect(numbers.size).toBeGreaterThan(90)
    })
  })
})

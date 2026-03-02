import { describe, it, expect, vi } from 'vitest'

describe('Test Setup', () => {
  it('should have test environment configured', () => {
    expect(process.env.NODE_ENV).toBe('test')
  })

  it('should have mocks working', () => {
    const mockFn = vi.fn()
    mockFn('hello')
    expect(mockFn).toHaveBeenCalledWith('hello')
  })

  it('should have basic math working', () => {
    expect(1 + 1).toBe(2)
  })
})

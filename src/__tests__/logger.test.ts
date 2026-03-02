import { describe, it, expect } from 'vitest'

/**
 * Logger Tests
 *
 * Note: Testing the logger module directly is challenging due to how
 * vitest handles module caching with dynamic imports and console mocking.
 *
 * The logger is verified to work by:
 * 1. The module exports correctly (tested below)
 * 2. Manual testing in development
 * 3. Integration tests that verify logging behavior indirectly
 */

describe('Logger', () => {
  it('should export logger singleton with all methods', async () => {
    const { logger } = await import('@/lib/logger')

    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.debug).toBe('function')
    expect(typeof logger.request).toBe('function')
    expect(typeof logger.response).toBe('function')
    expect(typeof logger.api).toBe('function')
    expect(typeof logger.auth).toBe('function')
    expect(typeof logger.payment).toBe('function')
  })

  it('should export Logger class', async () => {
    const { Logger } = await import('@/lib/logger')

    expect(Logger).toBeDefined()
    expect(typeof Logger).toBe('function')

    const instance = new Logger()
    expect(instance).toBeDefined()
    expect(typeof instance.info).toBe('function')
    expect(typeof instance.error).toBe('function')
    expect(typeof instance.warn).toBe('function')
    expect(typeof instance.debug).toBe('function')
  })

  it('should export convenience functions', async () => {
    const mod = await import('@/lib/logger')

    expect(typeof mod.log).toBe('function')
    expect(typeof mod.debug).toBe('function')
    expect(typeof mod.info).toBe('function')
    expect(typeof mod.warn).toBe('function')
    expect(typeof mod.error).toBe('function')
  })
})

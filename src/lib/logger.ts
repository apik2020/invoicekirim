/**
 * Logger Utility
 * Only logs in development mode, suppresses in production
 */

const isDev = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

type LogArgs = unknown[]

export const logger = {
  log: (...args: LogArgs) => {
    if (isDev && !isTest) {
      console.log(...args)
    }
  },

  debug: (...args: LogArgs) => {
    if (isDev && !isTest) {
      console.debug(...args)
    }
  },

  info: (...args: LogArgs) => {
    if (isDev && !isTest) {
      console.info(...args)
    }
  },

  warn: (...args: LogArgs) => {
    // Always show warnings, but consider using error tracking in production
    console.warn(...args)
  },

  error: (...args: LogArgs) => {
    // Always show errors - in production these should go to error tracking
    console.error(...args)
  },

  // For development-only debugging with prefix
  dev: (prefix: string, ...args: LogArgs) => {
    if (isDev && !isTest) {
      console.log(`[${prefix}]`, ...args)
    }
  },

  // For tracking performance (only in dev)
  time: (label: string) => {
    if (isDev && !isTest) {
      console.time(label)
    }
  },

  timeEnd: (label: string) => {
    if (isDev && !isTest) {
      console.timeEnd(label)
    }
  },

  // Group logging
  group: (label: string) => {
    if (isDev && !isTest) {
      console.group(label)
    }
  },

  groupEnd: () => {
    if (isDev && !isTest) {
      console.groupEnd()
    }
  },
}

// Convenience exports
export const log = logger.log
export const debug = logger.debug
export const info = logger.info
export const warn = logger.warn
export const error = logger.error

export default logger

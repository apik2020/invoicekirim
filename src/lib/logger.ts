/**
 * Logger Utility
 * Structured logging with production-ready features
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  requestId?: string
  userId?: string
  environment: string
}

const isDev = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'
const isProd = process.env.NODE_ENV === 'production'

class Logger {
  private formatMessage(entry: LogEntry): string {
    if (isProd) {
      // Structured JSON logging for production (easier to parse by log aggregators)
      return JSON.stringify(entry)
    }
    // Human-readable format for development
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
    return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}`
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    // Skip debug logs in production and test
    if (level === 'debug' && (isProd || isTest)) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      environment: process.env.NODE_ENV || 'development',
    }

    const formattedMessage = this.formatMessage(entry)

    switch (level) {
      case 'error':
        console.error(formattedMessage)
        break
      case 'warn':
        console.warn(formattedMessage)
        break
      case 'info':
        console.info(formattedMessage)
        break
      case 'debug':
        console.debug(formattedMessage)
        break
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = { ...context }

    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: isProd ? undefined : error.stack,
      }
    } else if (error) {
      errorContext.error = error
    }

    this.log('error', message, errorContext)
  }

  // Request-specific logging
  request(method: string, path: string, context?: LogContext): void {
    this.info(`HTTP ${method} ${path}`, context)
  }

  response(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
    this.log(level, `HTTP ${method} ${path} ${statusCode} (${duration}ms)`, context)
  }

  // API-specific logging
  api(method: string, endpoint: string, context?: LogContext): void {
    this.info(`API ${method} ${endpoint}`, context)
  }

  // Database logging
  db(query: string, duration?: number, context?: LogContext): void {
    this.debug(`DB Query${duration ? ` (${duration}ms)` : ''}`, { query: query.slice(0, 200), ...context })
  }

  // Auth logging
  auth(event: string, context?: LogContext): void {
    this.info(`Auth: ${event}`, context)
  }

  // Payment logging
  payment(event: string, context?: LogContext): void {
    this.info(`Payment: ${event}`, context)
  }

  // Legacy compatibility methods
  legacyLog(...args: unknown[]): void {
    if (isDev && !isTest) {
      console.log(...args)
    }
  }

  dev(prefix: string, ...args: unknown[]): void {
    if (isDev && !isTest) {
      console.log(`[${prefix}]`, ...args)
    }
  }

  time(label: string): void {
    if (isDev && !isTest) {
      console.time(label)
    }
  }

  timeEnd(label: string): void {
    if (isDev && !isTest) {
      console.timeEnd(label)
    }
  }

  group(label: string): void {
    if (isDev && !isTest) {
      console.group(label)
    }
  }

  groupEnd(): void {
    if (isDev && !isTest) {
      console.groupEnd()
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Convenience exports (for backward compatibility)
export const legacyLog = logger.legacyLog.bind(logger)
export const debug = logger.debug.bind(logger)
export const info = logger.info.bind(logger)
export const warn = logger.warn.bind(logger)
export const error = logger.error.bind(logger)

// Keep 'log' as alias for backward compatibility
export const log = legacyLog

// Export class for testing
export { Logger }

export default logger

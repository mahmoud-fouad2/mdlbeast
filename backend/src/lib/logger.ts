/**
 * ============================================================================
 * نظام التسجيل الموحد - Unified Logger System
 * ============================================================================
 * 
 * نظام احترافي لتسجيل الأحداث والأخطاء بشكل موحد
 * يدعم مستويات مختلفة وألوان للتمييز
 * 
 * @version 2.0
 * @author ZACO Team
 * ============================================================================
 */

import { logBuffer } from './logBuffer'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface LogContext {
  module?: string
  function?: string
  userId?: number
  requestId?: string
  ip?: string
  [key: string]: any
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m',  // Cyan
  info: '\x1b[32m',   // Green
  warn: '\x1b[33m',   // Yellow
  error: '\x1b[31m',  // Red
  fatal: '\x1b[35m',  // Magenta
}

const RESET_COLOR = '\x1b[0m'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
}

// ============================================================================
// LOGGER CLASS
// ============================================================================

class Logger {
  private module: string
  private minLevel: LogLevel

  constructor(module: string = 'App') {
    this.module = module
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
  }

  /**
   * Create a child logger with a specific module name
   */
  child(module: string): Logger {
    return new Logger(module)
  }

  /**
   * Format log message for console output
   */
  private format(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const color = LOG_COLORS[level]
    const levelUpper = level.toUpperCase().padEnd(5)
    
    let formatted = `${color}[${timestamp}] [${levelUpper}] [${this.module}]${RESET_COLOR} ${message}`
    
    if (context && Object.keys(context).length > 0) {
      // Filter out sensitive data
      const safeContext = this.sanitizeContext(context)
      formatted += ` ${JSON.stringify(safeContext)}`
    }
    
    return formatted
  }

  /**
   * Remove sensitive data from context
   */
  private sanitizeContext(context: LogContext): LogContext {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'cookie']
    const sanitized: LogContext = {}
    
    for (const [key, value] of Object.entries(context)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'string' && value.length > 500) {
        sanitized[key] = value.substring(0, 500) + '...[truncated]'
      } else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  }

  /**
   * Should this log level be output?
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel]
  }

  /**
   * Core log method
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return

    const formatted = this.format(level, message, context)
    
    // Add to logBuffer for admin viewing
    const bufferLevel = level === 'fatal' ? 'error' : level === 'debug' ? 'info' : level
    logBuffer.push(bufferLevel as any, `[${this.module}] ${message}`)

    // Console output
    switch (level) {
      case 'error':
      case 'fatal':
        console.error(formatted)
        if (error) {
          console.error(`${LOG_COLORS.error}  Stack: ${error.stack}${RESET_COLOR}`)
        }
        break
      case 'warn':
        console.warn(formatted)
        break
      default:
        console.log(formatted)
    }
  }

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

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
    const err = error instanceof Error ? error : new Error(String(error))
    this.log('error', message, { ...context, errorMessage: err.message }, err)
  }

  fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : new Error(String(error))
    this.log('fatal', message, { ...context, errorMessage: err.message }, err)
  }

  /**
   * Log API request/response
   */
  request(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
    const message = `${method} ${path} ${statusCode} ${duration}ms`
    this.log(level, message, context)
  }

  /**
   * Log database query
   */
  query(sql: string, duration: number, rowCount?: number): void {
    // Only log slow queries in production
    if (process.env.NODE_ENV === 'production' && duration < 1000) return
    
    const truncatedSql = sql.length > 200 ? sql.substring(0, 200) + '...' : sql
    this.debug(`Query executed`, { sql: truncatedSql, duration: `${duration}ms`, rows: rowCount })
  }

  /**
   * Log authentication events
   */
  auth(action: 'login' | 'logout' | 'refresh' | 'failed', userId?: number, context?: LogContext): void {
    const level: LogLevel = action === 'failed' ? 'warn' : 'info'
    this.log(level, `Auth: ${action}`, { ...context, userId })
  }

  /**
   * Log payment/financial events
   */
  payment(action: string, amount?: number, context?: LogContext): void {
    this.info(`Payment: ${action}`, { ...context, amount })
  }

  /**
   * Log project events
   */
  project(action: string, projectId?: number, context?: LogContext): void {
    this.info(`Project: ${action}`, { ...context, projectId })
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const logger = new Logger('App')

// Module-specific loggers
export const authLogger = new Logger('Auth')
export const dbLogger = new Logger('Database')
export const apiLogger = new Logger('API')
export const paymentLogger = new Logger('Payment')
export const projectLogger = new Logger('Project')
export const uploadLogger = new Logger('Upload')
export const notificationLogger = new Logger('Notification')

// Factory function to create module loggers
export function createLogger(module: string): Logger {
  return new Logger(module)
}

export default logger

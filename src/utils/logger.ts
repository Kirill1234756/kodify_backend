/**
 * Simple logger utility
 * In development: logs everything to console with colors
 * In production: logs errors and warnings only, without sensitive data
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

class Logger {
    private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
        const timestamp = new Date().toISOString()
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`
        return `${prefix} ${message}`
    }

    private shouldLog(level: LogLevel): boolean {
        if (isTest) return false // Don't log in tests
        if (isDevelopment) return true // Log everything in development
        // In production: only log warn and error
        return level === 'warn' || level === 'error'
    }

    debug(message: string, ...args: any[]): void {
        if (this.shouldLog('debug')) {
            console.log(this.formatMessage('debug', message), ...args)
        }
    }

    info(message: string, ...args: any[]): void {
        if (this.shouldLog('info')) {
            console.log(this.formatMessage('info', message), ...args)
        }
    }

    warn(message: string, ...args: any[]): void {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message), ...args)
        }
    }

    error(message: string, error?: any, ...args: any[]): void {
        if (this.shouldLog('error')) {
            const errorDetails = error instanceof Error
                ? {
                    message: error.message,
                    stack: isDevelopment ? error.stack : undefined,
                    name: error.name
                }
                : error

            console.error(this.formatMessage('error', message), errorDetails, ...args)
        }
    }
}

export const logger = new Logger()


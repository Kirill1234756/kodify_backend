/**
 * Environment variables validation and configuration
 * Validates required variables for production, allows optional for development
 */

import dotenv from 'dotenv'
import path from 'path'

// Load .env file
dotenv.config()

const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV

interface EnvConfig {
    // Server
    NODE_ENV: 'development' | 'production' | 'test'
    PORT: number
    FRONTEND_URL: string
    FRONTEND_URLS: string[]
    
    // Database (required)
    DB_HOST: string
    DB_PORT: number
    DB_NAME: string
    DB_USER: string
    DB_PASSWORD: string
    
    // File Storage
    UPLOAD_DIR: string
    PUBLIC_URL: string
    
    // Email (optional in dev, required in prod if used)
    SMTP_HOST?: string
    SMTP_PORT?: number
    SMTP_USER?: string
    SMTP_PASS?: string
    ADMIN_EMAIL?: string
    
    // Telegram (optional in dev, required in prod if used)
    TELEGRAM_BOT_TOKEN?: string
    TELEGRAM_CHAT_ID?: string
    
    // Bitrix24 (optional)
    BITRIX24_WEBHOOK_URL?: string
    BITRIX24_DOMAIN?: string
    BITRIX24_USER_ID?: string
    BITRIX24_AUTH_TOKEN?: string
    
    // Development flags
    DEV_SKIP_EMAIL_TEST?: boolean
    DEV_SKIP_BITRIX_TEST?: boolean
}

class EnvValidator {
    private errors: string[] = []
    private warnings: string[] = []

    private require(key: string, value: any, message?: string): void {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            this.errors.push(message || `Missing required environment variable: ${key}`)
        }
    }

    private requireIf(condition: boolean, key: string, value: any, message?: string): void {
        if (condition) {
            this.require(key, value, message)
        }
    }

    private warn(key: string, message?: string): void {
        this.warnings.push(message || `Optional environment variable not set: ${key}`)
    }

    validate(): EnvConfig {
        const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test'
        
        // Server configuration
        this.require('PORT', process.env.PORT, 'PORT is required')
        const port = parseInt(process.env.PORT || '3000', 10)
        if (isNaN(port) || port < 1 || port > 65535) {
            this.errors.push('PORT must be a number between 1 and 65535')
        }

        this.require('FRONTEND_URL', process.env.FRONTEND_URL, 'FRONTEND_URL is required')
        const frontendUrl = process.env.FRONTEND_URL!
        const frontendUrls = (process.env.FRONTEND_URLS || frontendUrl)
            .split(',')
            .map(u => u.trim())
            .filter(Boolean)

        // Database configuration (always required)
        this.require('DB_HOST', process.env.DB_HOST, 'DB_HOST is required')
        this.require('DB_NAME', process.env.DB_NAME, 'DB_NAME is required')
        this.require('DB_USER', process.env.DB_USER, 'DB_USER is required')
        this.require('DB_PASSWORD', process.env.DB_PASSWORD, 'DB_PASSWORD is required')
        
        const dbPort = parseInt(process.env.DB_PORT || '5432', 10)
        if (isNaN(dbPort) || dbPort < 1 || dbPort > 65535) {
            this.errors.push('DB_PORT must be a number between 1 and 65535')
        }

        // File storage
        const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
        const publicUrl = process.env.PUBLIC_URL || (process.env.FRONTEND_URL?.replace(/\/$/, '') || `http://localhost:${port}`)

        // Email (optional)
        const smtpHost = process.env.SMTP_HOST
        const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined
        const smtpUser = process.env.SMTP_USER
        const smtpPass = process.env.SMTP_PASS
        const adminEmail = process.env.ADMIN_EMAIL

        // If any email config is set, require all
        if (smtpHost || smtpUser || smtpPass || adminEmail) {
            this.requireIf(isProduction, 'SMTP_HOST', smtpHost, 'SMTP_HOST is required if email is configured')
            this.requireIf(isProduction, 'SMTP_USER', smtpUser, 'SMTP_USER is required if email is configured')
            this.requireIf(isProduction, 'SMTP_PASS', smtpPass, 'SMTP_PASS is required if email is configured')
            this.requireIf(isProduction, 'ADMIN_EMAIL', adminEmail, 'ADMIN_EMAIL is required if email is configured')
        }

        // Telegram (optional)
        const telegramToken = process.env.TELEGRAM_BOT_TOKEN
        const telegramChatId = process.env.TELEGRAM_CHAT_ID

        // If telegram is configured, require both
        if (telegramToken || telegramChatId) {
            this.requireIf(isProduction, 'TELEGRAM_BOT_TOKEN', telegramToken, 'TELEGRAM_BOT_TOKEN is required if Telegram is configured')
            this.requireIf(isProduction, 'TELEGRAM_CHAT_ID', telegramChatId, 'TELEGRAM_CHAT_ID is required if Telegram is configured')
        }

        // Bitrix24 (optional)
        const bitrixWebhook = process.env.BITRIX24_WEBHOOK_URL
        const bitrixDomain = process.env.BITRIX24_DOMAIN
        const bitrixUserId = process.env.BITRIX24_USER_ID
        const bitrixAuthToken = process.env.BITRIX24_AUTH_TOKEN

        // Development flags
        const devSkipEmailTest = process.env.DEV_SKIP_EMAIL_TEST === 'true'
        const devSkipBitrixTest = process.env.DEV_SKIP_BITRIX_TEST === 'true'

        // Report errors
        if (this.errors.length > 0) {
            console.error('\n❌ Environment variable validation failed:\n')
            this.errors.forEach(error => console.error(`   - ${error}`))
            console.error('\n')
            if (isDevelopment) {
                console.warn('⚠️  In development mode, some variables may be optional.\n')
            }
            throw new Error('Environment variable validation failed')
        }

        // Report warnings in development
        if (isDevelopment && this.warnings.length > 0) {
            console.warn('\n⚠️  Environment variable warnings:\n')
            this.warnings.forEach(warning => console.warn(`   - ${warning}`))
            console.warn('')
        }

        return {
            NODE_ENV: nodeEnv,
            PORT: port,
            FRONTEND_URL: frontendUrl,
            FRONTEND_URLS: frontendUrls,
            DB_HOST: process.env.DB_HOST!,
            DB_PORT: dbPort,
            DB_NAME: process.env.DB_NAME!,
            DB_USER: process.env.DB_USER!,
            DB_PASSWORD: process.env.DB_PASSWORD!,
            UPLOAD_DIR: uploadDir,
            PUBLIC_URL: publicUrl,
            SMTP_HOST: smtpHost,
            SMTP_PORT: smtpPort,
            SMTP_USER: smtpUser,
            SMTP_PASS: smtpPass,
            ADMIN_EMAIL: adminEmail,
            TELEGRAM_BOT_TOKEN: telegramToken,
            TELEGRAM_CHAT_ID: telegramChatId,
            BITRIX24_WEBHOOK_URL: bitrixWebhook,
            BITRIX24_DOMAIN: bitrixDomain,
            BITRIX24_USER_ID: bitrixUserId,
            BITRIX24_AUTH_TOKEN: bitrixAuthToken,
            DEV_SKIP_EMAIL_TEST: devSkipEmailTest,
            DEV_SKIP_BITRIX_TEST: devSkipBitrixTest,
        }
    }
}

// Validate and export config
let envConfig: EnvConfig | null = null

export function getEnvConfig(): EnvConfig {
    if (!envConfig) {
        const validator = new EnvValidator()
        envConfig = validator.validate()
    }
    return envConfig
}

// Export individual getters for backward compatibility
export const env = getEnvConfig()


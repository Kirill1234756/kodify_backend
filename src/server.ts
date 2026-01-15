import express from 'express'
import { Server } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import path from 'path'
import { generalRateLimit } from './middleware/rateLimit'
import clientFormRoutes from './routes/clientForm.routes'
import contactFormRoutes from './routes/contactForm.routes'
import calculatorRoutes from './routes/calculator.routes'
import { EmailService } from './services/emailService'
import { TelegramService } from './services/telegramService'
import { BitrixService } from './services/bitrixService'
import { DatabaseService } from './services/databaseService'
import { STORAGE_CONFIG, pool } from './config/database'
import { logger } from './utils/logger'
import { handleError } from './utils/errors'

// Load environment variables
dotenv.config()

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

const app = express()
const PORT = process.env.PORT || 3000
// Support multiple frontend origins via FRONTEND_URLS (comma-separated) or single FRONTEND_URL
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const FRONTEND_URLS = (process.env.FRONTEND_URLS || FRONTEND_URL)
    .split(',')
    .map(u => u.trim())
    .filter(Boolean)

// CORS configuration - MUST be before helmet and other middleware
const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            if (isDevelopment) {
                logger.debug('CORS: Allowing request with no origin')
            }
            return callback(null, true)
        }

        // Check if origin is in allowed list
        if (FRONTEND_URLS.includes(origin)) {
            if (isDevelopment) {
                logger.debug(`CORS: Allowed origin: ${origin}`)
            }
            return callback(null, true)
        }

        // Allow http/https toggle for same domain
        const toggled = origin.startsWith('https://')
            ? origin.replace('https://', 'http://')
            : origin.replace('http://', 'https://')
        if (FRONTEND_URLS.includes(toggled)) {
            if (isDevelopment) {
                logger.debug(`CORS: Allowed toggled origin: ${origin} → ${toggled}`)
            }
            return callback(null, true)
        }

        // In development, log blocked origins
        if (isDevelopment) {
            logger.warn(`CORS: Blocked origin: ${origin}. Allowed: ${FRONTEND_URLS.join(', ')}`)
        }

        callback(null, false)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204
}

// Apply CORS middleware FIRST, before any other middleware
app.use(cors(corsOptions))

// Explicit OPTIONS handler for all API routes - handles preflight requests
// This MUST be after CORS middleware but before Helmet
app.options('/api/*', (req: express.Request, res: express.Response) => {
    const origin = req.headers.origin

    if (isDevelopment) {
        logger.debug(`OPTIONS preflight request to: ${req.path}`)
        logger.debug(`   Origin: ${origin || 'none'}`)
    }

    // Check if origin is allowed
    let isAllowed = false
    if (!origin) {
        isAllowed = true
    } else if (FRONTEND_URLS.includes(origin)) {
        isAllowed = true
    } else {
        const toggled = origin.startsWith('https://')
            ? origin.replace('https://', 'http://')
            : origin.replace('http://', 'https://')
        if (FRONTEND_URLS.includes(toggled)) {
            isAllowed = true
        }
    }

    if (isAllowed) {
        // Set CORS headers explicitly
        if (origin) {
            res.setHeader('Access-Control-Allow-Origin', origin)
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers')
        res.setHeader('Access-Control-Allow-Credentials', 'true')
        res.setHeader('Access-Control-Max-Age', '86400')

        if (isDevelopment) {
            logger.debug(`OPTIONS: Allowed preflight for ${origin || 'no origin'}`)
        }

        return res.status(204).send()
    } else {
        if (isDevelopment) {
            logger.warn(`OPTIONS: Blocked preflight for origin: ${origin}`)
        }
        return res.status(403).json({
            success: false,
            message: 'CORS policy: Origin not allowed'
        })
    }
})

// Security middleware - AFTER CORS and OPTIONS handler to not interfere with CORS headers
// Configure helmet to not block CORS headers
app.use(helmet({
    contentSecurityPolicy: isProduction ? {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    } : false, // Disable CSP in development for easier debugging
    // Disable all CORS-related policies to allow CORS headers to work
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false, // Disable to allow CORS
    crossOriginOpenerPolicy: false // Disable to allow CORS
}))

// Rate limiting (enabled in production, can be disabled via env var)
if (isProduction && process.env.DISABLE_RATE_LIMIT !== 'true') {
    app.use(generalRateLimit)
} else if (isDevelopment) {
    logger.debug('Rate limiting disabled in development mode')
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve uploaded files statically
app.use('/uploads', express.static(STORAGE_CONFIG.UPLOAD_DIR))

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    })
})

// API routes
app.use('/api/client-form', clientFormRoutes)
app.use('/api/contact-form', contactFormRoutes)
app.use('/api/calculator-form', calculatorRoutes)

// Test endpoints for services (only in development)
if (isDevelopment) {
    app.get('/api/test/email', async (req, res) => {
        try {
            const result = await EmailService.testEmailConfiguration()
            res.json({
                success: result,
                message: result ? 'Email configuration is working' : 'Email configuration failed'
            })
        } catch (error) {
            const errorInfo = handleError(error)
            res.status(errorInfo.statusCode).json({
                success: false,
                message: 'Email test failed',
                error: errorInfo.message
            })
        }
    })

    app.get('/api/test/telegram', async (req, res) => {
        try {
            const result = await TelegramService.testBotConfiguration()
            res.json({
                success: result,
                message: result ? 'Telegram bot is working' : 'Telegram bot configuration failed'
            })
        } catch (error: any) {
            const errorDetails: any = {
                message: error?.message || 'Unknown error',
                code: error?.code,
                description: error?.description
            }

            // Try to extract more details from Telegram API error
            if (error?.response?.body) {
                errorDetails.telegramResponse = error.response.body
            }

            res.status(500).json({
                success: false,
                message: 'Telegram test failed',
                error: errorDetails
            })
        }
    })

    app.get('/api/test/bitrix', async (req, res) => {
        try {
            const result = await BitrixService.testConnection()
            res.json({
                success: result,
                message: result ? 'Bitrix24 connection is working' : 'Bitrix24 connection failed'
            })
        } catch (error) {
            const errorInfo = handleError(error)
            res.status(errorInfo.statusCode).json({
                success: false,
                message: 'Bitrix24 test failed',
                error: errorInfo.message
            })
        }
    })

    app.get('/api/test/database', async (req, res) => {
        try {
            const result = await DatabaseService.testConnection()
            res.json({
                success: result,
                message: result ? 'Database connection is working' : 'Database connection failed'
            })
        } catch (error) {
            const errorInfo = handleError(error)
            res.status(errorInfo.statusCode).json({
                success: false,
                message: 'Database test failed',
                error: errorInfo.message
            })
        }
    })
}

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    })
})

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Global error handler', error)

    const errorInfo = handleError(error)

    res.status(errorInfo.statusCode).json({
        success: false,
        message: errorInfo.message,
        ...(isDevelopment && error instanceof Error && { stack: error.stack }),
        ...(errorInfo.details && { errors: errorInfo.details })
    })
})

// Start server
let server: Server | null = null

try {
    server = app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`)
        logger.info(`Frontend URLs: ${FRONTEND_URLS.join(', ')}`)
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
        logger.info(`Health check: http://localhost:${PORT}/health`)

        // Test service configurations on startup (only in development)
        if (isDevelopment) {
            logger.info('Testing service configurations...')

            // Test database connection
            DatabaseService.testConnection().then(result => {
                logger.info(`Database: ${result ? 'Working' : 'Failed'}`)
            }).catch(() => {
                logger.warn('Database: Failed')
            })

            if (process.env.DEV_SKIP_EMAIL_TEST !== 'true') {
                EmailService.testEmailConfiguration().then(result => {
                    logger.info(`Email service: ${result ? 'Working' : 'Failed'}`)
                }).catch(() => {
                    logger.warn('Email service: Failed')
                })
            } else {
                logger.debug('Email service test skipped')
            }

            TelegramService.testBotConfiguration().then(result => {
                logger.info(`Telegram service: ${result ? 'Working' : 'Failed'}`)
            }).catch(() => {
                logger.warn('Telegram service: Failed')
            })

            if (process.env.DEV_SKIP_BITRIX_TEST !== 'true') {
                BitrixService.testConnection().then(result => {
                    logger.info(`Bitrix24 service: ${result ? 'Working' : 'Failed'}`)
                }).catch(() => {
                    logger.warn('Bitrix24 service: Failed')
                })
            } else {
                logger.debug('Bitrix24 service test skipped')
            }
        }
    })

    // Handle server errors
    if (server) {
        server.on('error', (error: NodeJS.ErrnoException) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`Port ${PORT} is already in use!`)
                logger.error(`Please stop the process using port ${PORT} or use a different port.`)
                if (process.platform === 'win32') {
                    logger.error(`You can use: backend/kill-port.ps1 ${PORT}`)
                }
                logger.error(`Or find the process: netstat -ano | findstr :${PORT}`)
                process.exit(1)
            } else {
                logger.error('Server error', error)
                process.exit(1)
            }
        })
    }
} catch (error) {
    logger.error('Failed to start server', error)
    process.exit(1)
}

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`)

    // Stop accepting new connections
    if (server) {
        server.close(() => {
            logger.info('HTTP server closed')
        })
    }

    // Close database connections
    try {
        await pool.end()
        logger.info('Database connections closed')
    } catch (error) {
        logger.error('Error closing database connections', error)
    }

    // Give connections time to close
    setTimeout(() => {
        logger.info('Shutdown complete')
        process.exit(0)
    }, 1000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
    // Don't exit in development for easier debugging
    if (isProduction) {
        process.exit(1)
    }
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error)
    process.exit(1)
})

export default app

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
import { renderSeoCorePage } from './views/seo-core-ssr'
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

// SSR: SEO core page (server-rendered HTML)
app.get('/seo-core', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(String(req.query.page || 1), 10) || 1)
        // Для SEO ядра по умолчанию показываем все строки (до 5000),
        // чтобы таблица выглядела как единый Google Sheet.
        const rawLimit = parseInt(String(req.query.limit || 5000), 10)
        const limit = Math.max(1, Math.min(Number.isNaN(rawLimit) ? 5000 : rawLimit, 5000))
        const path = req.query.path ? String(req.query.path).trim() : ''
        const clusterId = req.query.clusterId ? String(req.query.clusterId).trim() : ''
        const city = req.query.city ? String(req.query.city).trim() : ''
        const intent = req.query.intent ? String(req.query.intent).trim() : ''
        const freqBucket = req.query.freqBucket ? String(req.query.freqBucket).trim() : ''
        const search = req.query.search ? String(req.query.search).trim() : ''

        const [coreResult, pagesResult, clustersResult] = await Promise.all([
            DatabaseService.getSeoCoreList({
                page,
                limit,
                path: path || undefined,
                clusterId: clusterId || undefined,
                city: city || undefined,
                intent: intent || undefined,
                freqBucket: freqBucket || undefined,
                search: search || undefined,
            }),
            DatabaseService.listSeoPages({ page: 1, limit: 500 }),
            DatabaseService.listSeoClusters({ page: 1, limit: 500 }),
        ])

        const baseUrl = `${req.protocol}://${req.get('host') || 'localhost'}${req.path}`
        const apiBase = `${req.protocol}://${req.get('host') || 'localhost'}`

        const html = renderSeoCorePage({
            rows: coreResult.data,
            total: coreResult.total,
            page,
            limit,
            pages: pagesResult.data.map((p) => ({ id: p.id, path: p.path })),
            clusters: clustersResult.data.map((c) => ({ id: c.id, name: c.name })),
            filters: { path, clusterId, city, intent, freqBucket, search },
            baseUrl,
            apiBase,
        })

        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.send(html)
    } catch (error) {
        logger.error('Error in GET /seo-core (SSR):', error)
        res.status(500).send('<h1>Ошибка сервера</h1><p>Не удалось загрузить данные SEO ядра.</p>')
    }
})

// API routes
app.use('/api/client-form', clientFormRoutes)
app.use('/api/contact-form', contactFormRoutes)
app.use('/api/calculator-form', calculatorRoutes)

// SEO API routes
app.get('/api/seo/page', async (req, res) => {
    try {
        const path = String(req.query.path || '').trim()
        const city = req.query.city ? String(req.query.city).trim() : undefined

        if (!path) {
            return res.status(400).json({
                success: false,
                message: 'Query parameter "path" is required'
            })
        }

        const seoPage = await DatabaseService.getSeoPageByPath(path, city)

        if (!seoPage) {
            return res.status(404).json({
                success: false,
                message: 'SEO configuration not found for the given path',
            })
        }

        return res.status(200).json({
            success: true,
            data: seoPage,
        })
    } catch (error) {
        logger.error('Error in /api/seo/page:', error)
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching SEO page',
        })
    }
})

app.get('/api/seo/keywords', async (req, res) => {
    try {
        const path = req.query.path ? String(req.query.path) : undefined
        const clusterId = req.query.clusterId ? String(req.query.clusterId) : undefined
        const intent = req.query.intent ? String(req.query.intent) : undefined
        const freqBucket = req.query.freqBucket ? String(req.query.freqBucket) : undefined
        const city = req.query.city ? String(req.query.city) : undefined
        const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined

        if (!path && !clusterId) {
            return res.status(400).json({
                success: false,
                message: 'Either "path" or "clusterId" query parameter is required',
            })
        }

        const result = await DatabaseService.getSeoKeywords({
            path,
            clusterId,
            intent,
            freqBucket,
            city,
            limit,
        })

        return res.status(200).json({
            success: true,
            data: result,
        })
    } catch (error) {
        logger.error('Error in /api/seo/keywords:', error)
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching SEO keywords',
        })
    }
})

// --- SEO Admin API (simple REST for editing title/meta/H1 and cluster→page bindings) ---
// Optional: protect with API key (e.g. X-Admin-Key header) or auth middleware

app.get('/api/seo/pages', async (req, res) => {
    try {
        const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined
        const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined
        const result = await DatabaseService.listSeoPages({ page, limit })
        return res.status(200).json({ success: true, data: result })
    } catch (error) {
        logger.error('Error in GET /api/seo/pages:', error)
        return res.status(500).json({ success: false, message: 'Internal server error' })
    }
})

app.get('/api/seo/pages/:id', async (req, res) => {
    try {
        const page = await DatabaseService.getSeoPageById(req.params.id)
        if (!page) return res.status(404).json({ success: false, message: 'SEO page not found' })
        return res.status(200).json({ success: true, data: page })
    } catch (error) {
        logger.error('Error in GET /api/seo/pages/:id:', error)
        return res.status(500).json({ success: false, message: 'Internal server error' })
    }
})

app.patch('/api/seo/pages/:id', async (req, res) => {
    try {
        const body = req.body || {}
        const payload: {
            title?: string
            h1?: string
            description?: string
            h2_outline?: string[]
            faq?: string[]
            canonical_path?: string
            og_image?: string
            is_indexable?: boolean
            noindex?: boolean
        } = {}
        if (body.title !== undefined) payload.title = String(body.title)
        if (body.h1 !== undefined) payload.h1 = String(body.h1)
        if (body.description !== undefined) payload.description = String(body.description)
        if (Array.isArray(body.h2Outline)) payload.h2_outline = body.h2Outline
        if (Array.isArray(body.faq)) payload.faq = body.faq
        if (body.canonicalPath !== undefined) payload.canonical_path = String(body.canonicalPath)
        if (body.ogImage !== undefined) payload.og_image = String(body.ogImage)
        if (body.isIndexable !== undefined) payload.is_indexable = Boolean(body.isIndexable)
        if (body.noindex !== undefined) payload.noindex = Boolean(body.noindex)

        const updated = await DatabaseService.updateSeoPage(req.params.id, payload)
        if (!updated) return res.status(404).json({ success: false, message: 'SEO page not found' })
        return res.status(200).json({ success: true, data: updated })
    } catch (error) {
        logger.error('Error in PATCH /api/seo/pages/:id:', error)
        return res.status(500).json({ success: false, message: 'Internal server error' })
    }
})

app.get('/api/seo/clusters', async (req, res) => {
    try {
        const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined
        const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined
        const city = req.query.city ? String(req.query.city) : undefined
        const seoPageId = req.query.seoPageId ? String(req.query.seoPageId) : undefined
        const result = await DatabaseService.listSeoClusters({ page, limit, city, seoPageId })
        return res.status(200).json({ success: true, data: result })
    } catch (error) {
        logger.error('Error in GET /api/seo/clusters:', error)
        return res.status(500).json({ success: false, message: 'Internal server error' })
    }
})

app.get('/api/seo/core', async (req, res) => {
    try {
        const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined
        const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined
        const path = req.query.path ? String(req.query.path).trim() || undefined : undefined
        const clusterId = req.query.clusterId ? String(req.query.clusterId).trim() || undefined : undefined
        const city = req.query.city ? String(req.query.city).trim() || undefined : undefined
        const intent = req.query.intent ? String(req.query.intent).trim() || undefined : undefined
        const freqBucket = req.query.freqBucket ? String(req.query.freqBucket).trim() || undefined : undefined
        const search = req.query.search ? String(req.query.search).trim() || undefined : undefined
        const result = await DatabaseService.getSeoCoreList({
            page, limit, path, clusterId, city, intent, freqBucket, search
        })
        return res.status(200).json({ success: true, data: result })
    } catch (error) {
        logger.error('Error in GET /api/seo/core:', error)
        return res.status(500).json({ success: false, message: 'Internal server error' })
    }
})

app.patch('/api/seo/clusters/:id', async (req, res) => {
    try {
        const seoPageId = req.body?.seoPageId !== undefined
            ? (req.body.seoPageId === null || req.body.seoPageId === ''
                ? null
                : String(req.body.seoPageId))
            : undefined
        if (seoPageId === undefined) {
            return res.status(400).json({ success: false, message: 'Body "seoPageId" (or null to unassign) is required' })
        }
        const updated = await DatabaseService.updateClusterSeoPage(req.params.id, seoPageId)
        if (!updated) return res.status(404).json({ success: false, message: 'Cluster not found' })
        return res.status(200).json({ success: true, data: updated })
    } catch (error) {
        logger.error('Error in PATCH /api/seo/clusters/:id:', error)
        return res.status(500).json({ success: false, message: 'Internal server error' })
    }
})

// Test endpoints for services (available in both dev and production for diagnostics)
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

// Additional test endpoints (only in development)
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
        console.log(`\n✅ Server running at http://localhost:${PORT}\n`)
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

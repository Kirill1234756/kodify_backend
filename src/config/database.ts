import { Pool, PoolConfig } from 'pg'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

// Load environment variables first (before using them)
dotenv.config()

// When .env has DB_HOST=postgres (for Docker), use localhost if we're not in Docker (host can't resolve "postgres")
let dbHost = process.env.DB_HOST || 'localhost'
if (dbHost === 'postgres') {
    const inDocker =
        process.platform !== 'win32' && fs.existsSync('/.dockerenv')
    if (!inDocker) {
        dbHost = 'localhost'
        console.log('📌 DB_HOST=postgres overridden to localhost (not running in Docker)')
    }
}

// Ensure DB_PASSWORD is always a string (handle undefined, null, empty)
const getDbPassword = (): string => {
    const password = process.env.DB_PASSWORD
    if (password === undefined || password === null) {
        return ''
    }
    // Convert to string explicitly
    return String(password)
}

// PostgreSQL connection pool configuration
const dbConfig: PoolConfig = {
    host: dbHost,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'kodify_db',
    user: process.env.DB_USER || 'postgres',
    password: getDbPassword(), // Ensure password is always a string
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // Increased timeout to 5 seconds
}

// Log database configuration (without password) for debugging
if (process.env.NODE_ENV === 'development') {
    console.log('📊 Database configuration:')
    console.log(`   Host: ${dbConfig.host}`)
    console.log(`   Port: ${dbConfig.port}`)
    console.log(`   Database: ${dbConfig.database}`)
    console.log(`   User: ${dbConfig.user}`)
    console.log(`   Password: ${dbConfig.password ? '***' : '(empty)'}`)
}

// Create pool
export const pool = new Pool(dbConfig)

// Add error handler to pool for better debugging
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle PostgreSQL client:', err)
    process.exit(-1)
})

// Database table names
export const TABLES = {
    CLIENT_FORMS: 'client_forms',
    CONTACT_FORMS: 'contact_forms',
    CALCULATOR_FORMS: 'calculator_forms',
    SEO_PAGES: 'seo_pages',
    SEO_CLUSTERS: 'seo_clusters',
    SEO_KEYWORDS: 'seo_keywords',
} as const

// Form statuses
export const FORM_STATUSES = {
    NEW: 'new',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
} as const

// Form sources
export const FORM_SOURCES = {
    CLIENT_FORM: 'client_form',
    CONTACT_SECTION: 'contact_section',
    CALCULATOR: 'calculator',
} as const

// File upload limits
export const FILE_LIMITS = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_MIME_TYPES: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
    ],
} as const

// Storage configuration
export const STORAGE_CONFIG = {
    UPLOAD_DIR: path.join(process.cwd(), 'uploads'),
    PUBLIC_URL: process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`,
} as const

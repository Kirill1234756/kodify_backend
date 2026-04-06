import './dotenv-local'
import { Pool } from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'kodify_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
})

async function initDatabase() {
    const client = await pool.connect()
    const migrationsDir = path.join(__dirname, '..', 'sql', 'migrations')

    try {
        console.log('🔄 Initializing database...')

        const files = fs.readdirSync(migrationsDir)
            .filter((f) => f.endsWith('.sql'))
            .sort()

        for (const file of files) {
            const sqlPath = path.join(migrationsDir, file)
            const sql = fs.readFileSync(sqlPath, 'utf8')
            console.log(`   Running ${file}...`)
            await client.query(sql)
        }

        console.log('✅ Database migrations applied successfully!')

        const result = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('client_forms', 'contact_forms', 'calculator_forms', 'seo_pages', 'seo_clusters', 'seo_keywords')
            ORDER BY table_name
        `)

        console.log('📋 Tables:')
        result.rows.forEach((row: { table_name: string }) => {
            console.log(`   ✓ ${row.table_name}`)
        })
    } catch (error) {
        console.error('❌ Error initializing database:', error)
        process.exit(1)
    } finally {
        client.release()
        await pool.end()
    }
}

initDatabase()


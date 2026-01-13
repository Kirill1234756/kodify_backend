import { Pool } from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables
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
    
    try {
        console.log('🔄 Initializing database...')
        
        // Read SQL migration file
        const sqlPath = path.join(__dirname, '..', 'sql', 'migrations', '001_create_tables.sql')
        const sql = fs.readFileSync(sqlPath, 'utf8')
        
        // Execute SQL
        await client.query(sql)
        
        console.log('✅ Database tables created successfully!')
        console.log('📋 Created tables:')
        console.log('   - client_forms')
        console.log('   - contact_forms')
        console.log('   - calculator_forms')
        
        // Verify tables exist
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('client_forms', 'contact_forms', 'calculator_forms')
            ORDER BY table_name
        `)
        
        console.log('\n✅ Verification:')
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


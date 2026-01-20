import { pool, TABLES, FILE_LIMITS, FORM_STATUSES, FORM_SOURCES } from '../config/database'
import { FileStorageService } from './fileStorageService'

export interface ClientFormData {
    companyDescription: string
    task: string
    solutionVision: string
    expectations: string
    budget: string
    name: string
    company: string
    phone: string
    email: string
    attachedFile?: Express.Multer.File
    privacyAccepted: boolean
}

export interface ContactFormData {
    name: string
    phone: string
    email: string
}

export interface FormRecord {
    id: string
    created_at: string
    updated_at: string
    status: string
    source: string
    bitrix_lead_id?: number
    attached_file_url?: string | null
    attached_file_name?: string | null
    attached_file_size?: number | null
}

export class DatabaseService {
    /**
     * Save client form data to database
     */
    static async saveClientForm(formData: ClientFormData): Promise<FormRecord> {
        const client = await pool.connect()
        try {
            await client.query('BEGIN')

            let fileUrl: string | null = null
            let fileName: string | null = null
            let fileSize: number | null = null

            // Handle file upload if present
            if (formData.attachedFile) {
                const fileResult = await FileStorageService.uploadFile(formData.attachedFile)
                fileUrl = fileResult.url
                fileName = fileResult.fileName
                fileSize = fileResult.fileSize
            }

            // Insert form data
            const result = await client.query(
                `INSERT INTO ${TABLES.CLIENT_FORMS} (
                    company_description, task, solution_vision, expectations, budget,
                    name, company, phone, email,
                    attached_file_url, attached_file_name, attached_file_size,
                    status, source
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING *`,
                [
                    formData.companyDescription,
                    formData.task,
                    formData.solutionVision,
                    formData.expectations,
                    formData.budget,
                    formData.name,
                    formData.company,
                    formData.phone,
                    formData.email,
                    fileUrl,
                    fileName,
                    fileSize,
                    FORM_STATUSES.NEW,
                    FORM_SOURCES.CLIENT_FORM
                ]
            )

            await client.query('COMMIT')
            return this.mapRowToFormRecord(result.rows[0])
        } catch (error) {
            await client.query('ROLLBACK')
            console.error('Error saving client form:', error)
            throw error
        } finally {
            client.release()
        }
    }

    /**
     * Save contact form data to database
     */
    static async saveContactForm(formData: ContactFormData): Promise<FormRecord> {
        const client = await pool.connect()
        try {
            const result = await client.query(
                `INSERT INTO ${TABLES.CONTACT_FORMS} (name, phone, email, status, source)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *`,
                [
                    formData.name,
                    formData.phone,
                    formData.email,
                    FORM_STATUSES.NEW,
                    FORM_SOURCES.CONTACT_SECTION
                ]
            )

            return this.mapRowToFormRecord(result.rows[0])
        } catch (error) {
            console.error('Error saving contact form:', error)
            throw error
        } finally {
            client.release()
        }
    }

    /**
     * Save calculator form data to database
     * Falls back to contact_forms if calculator_forms table doesn't exist
     */
    static async saveCalculatorForm(formData: any): Promise<FormRecord> {
        const client = await pool.connect()
        try {
            // Try to insert into calculator_forms first
            try {
                const result = await client.query(
                    `INSERT INTO ${TABLES.CALCULATOR_FORMS} (
                        name, phone, email,
                        site_type, pages, design, features, content, seo, ads, urgency, support,
                        calculated_price, min_price, max_price, timeline,
                        status, source
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                    RETURNING *`,
                    [
                        formData.name,
                        formData.phone,
                        formData.email || null,
                        formData.siteType,
                        formData.pages || null,
                        formData.design,
                        JSON.stringify(Array.isArray(formData.features) ? formData.features : []),
                        formData.content,
                        formData.seo,
                        formData.ads || false,
                        formData.urgency,
                        formData.support,
                        formData.calculatedPrice || 0,
                        formData.minPrice || 0,
                        formData.maxPrice || 0,
                        formData.timeline || '',
                        FORM_STATUSES.NEW,
                        FORM_SOURCES.CALCULATOR
                    ]
                )

                return this.mapRowToFormRecord(result.rows[0])
            } catch (insertError: any) {
                // If calculator_forms table doesn't exist or insert failed, fallback to contact_forms
                console.warn('Failed to insert into calculator_forms, falling back to contact_forms:', insertError.message)
                
                const fallbackResult = await client.query(
                    `INSERT INTO ${TABLES.CONTACT_FORMS} (name, phone, email, status, source)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *`,
                    [
                        formData.name,
                        formData.phone,
                        formData.email || null,
                        FORM_STATUSES.NEW,
                        FORM_SOURCES.CALCULATOR
                    ]
                )

                console.log('Saved calculator form data to contact_forms as fallback')
                return this.mapRowToFormRecord(fallbackResult.rows[0])
            }
        } catch (error) {
            console.error('Error saving calculator form (both attempts failed):', error)
            throw error
        } finally {
            client.release()
        }
    }

    /**
     * Update form status
     */
    static async updateFormStatus(
        table: string,
        id: string,
        status: string,
        bitrixLeadId?: number
    ): Promise<void> {
        const client = await pool.connect()
        try {
            const updates: string[] = ['status = $2', 'updated_at = NOW()']
            const values: any[] = [id, status]
            let paramIndex = 3

            if (bitrixLeadId) {
                updates.push(`bitrix_lead_id = $${paramIndex}`)
                values.push(bitrixLeadId)
                paramIndex++
            }

            await client.query(
                `UPDATE ${table} SET ${updates.join(', ')} WHERE id = $1`,
                values
            )
        } catch (error) {
            console.error('Error updating form status:', error)
            throw error
        } finally {
            client.release()
        }
    }

    /**
     * Get form by ID
     */
    static async getFormById(table: string, id: string): Promise<FormRecord | null> {
        const client = await pool.connect()
        try {
            const result = await client.query(
                `SELECT * FROM ${table} WHERE id = $1`,
                [id]
            )

            if (result.rows.length === 0) {
                return null
            }

            return this.mapRowToFormRecord(result.rows[0])
        } catch (error) {
            console.error('Error getting form by ID:', error)
            throw error
        } finally {
            client.release()
        }
    }

    /**
     * Get all forms with pagination
     */
    static async getForms(
        table: string,
        page: number = 1,
        limit: number = 10,
        status?: string
    ): Promise<{ data: FormRecord[]; total: number; page: number; limit: number }> {
        const client = await pool.connect()
        try {
            // Build query with optional status filter
            let countQuery = `SELECT COUNT(*) as total FROM ${table}`
            let dataQuery = `SELECT * FROM ${table}`
            const queryParams: any[] = []
            let paramIndex = 1

            if (status) {
                const statusFilter = ` WHERE status = $${paramIndex}`
                countQuery += statusFilter
                dataQuery += statusFilter
                queryParams.push(status)
                paramIndex++
            }

            // Get total count
            const countResult = await client.query(countQuery, queryParams)
            const total = parseInt(countResult.rows[0].total)

            // Get paginated data
            dataQuery += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
            queryParams.push(limit, (page - 1) * limit)

            const dataResult = await client.query(dataQuery, queryParams)

            return {
                data: dataResult.rows.map(row => this.mapRowToFormRecord(row)),
                total,
                page,
                limit
            }
        } catch (error) {
            console.error('Error getting forms:', error)
            throw error
        } finally {
            client.release()
        }
    }

    /**
     * Delete old files (cleanup utility)
     */
    static async deleteOldFiles(daysOld: number = 30): Promise<void> {
        const client = await pool.connect()
        try {
            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - daysOld)

            // Get old file URLs from database
            const result = await client.query(
                `SELECT attached_file_url FROM ${TABLES.CLIENT_FORMS}
                WHERE attached_file_url IS NOT NULL
                AND created_at < $1`,
                [cutoffDate.toISOString()]
            )

            // Delete files from storage
            for (const row of result.rows) {
                if (row.attached_file_url) {
                    const filePath = FileStorageService.getFilePathFromUrl(row.attached_file_url)
                    if (filePath) {
                        await FileStorageService.deleteFile(filePath)
                    }
                }
            }

            console.log(`Deleted ${result.rows.length} old files`)
        } catch (error) {
            console.error('Error deleting old files:', error)
            throw error
        } finally {
            client.release()
        }
    }

    /**
     * Map database row to FormRecord
     */
    private static mapRowToFormRecord(row: any): FormRecord {
        return {
            id: row.id,
            created_at: row.created_at,
            updated_at: row.updated_at,
            status: row.status,
            source: row.source,
            bitrix_lead_id: row.bitrix_lead_id,
            attached_file_url: row.attached_file_url,
            attached_file_name: row.attached_file_name,
            attached_file_size: row.attached_file_size
        }
    }

    /**
     * Test database connection
     */
    static async testConnection(): Promise<boolean> {
        let client
        try {
            client = await pool.connect()
            await client.query('SELECT 1')
            console.log('✅ Database connection successful')
            return true
        } catch (error: any) {
            const errorMessage = error?.message || 'Unknown error'
            const errorCode = error?.code || 'UNKNOWN'
            
            console.error('❌ Database connection test failed:')
            console.error(`   Error code: ${errorCode}`)
            console.error(`   Error message: ${errorMessage}`)
            
            // Provide helpful error messages based on common issues
            if (errorCode === 'ECONNREFUSED' || errorMessage.includes('ECONNREFUSED')) {
                console.error('   💡 Tip: PostgreSQL may not be running. Check if the service is started.')
                console.error('   💡 On Windows: Get-Service -Name "*postgresql*"')
            } else if (errorCode === 'ENOTFOUND' || errorMessage.includes('ENOTFOUND')) {
                console.error('   💡 Tip: Cannot resolve database host. Check DB_HOST in .env file.')
            } else if (errorCode === '28P01' || errorMessage.includes('password authentication failed')) {
                console.error('   💡 Tip: Authentication failed. Check DB_USER and DB_PASSWORD in .env file.')
            } else if (errorCode === '3D000' || errorMessage.includes('database') && errorMessage.includes('does not exist')) {
                console.error('   💡 Tip: Database does not exist. Create it with: CREATE DATABASE kodify_db;')
            } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
                console.error('   💡 Tip: Connection timeout. Check if PostgreSQL is accessible and DB_HOST/DB_PORT are correct.')
            }
            
            return false
        } finally {
            if (client) {
            client.release()
            }
        }
    }
}


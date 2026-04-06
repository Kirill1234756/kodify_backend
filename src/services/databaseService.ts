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

// SEO-related interfaces
export interface SeoPage {
    id: string
    path: string
    page_type: string
    title: string
    h1: string | null
    description: string | null
    h2_outline: any[]
    faq: any[]
    canonical_path: string | null
    og_image: string | null
    is_indexable: boolean
    noindex: boolean
    city: string | null
    region_type: string | null
    created_at: string
    updated_at: string
}

export interface SeoCluster {
    id: string
    name: string
    intent: string | null
    user_stage: string | null
    category_level: string | null
    city: string | null
    priority_score: number
    seo_page_id: string | null
    created_at: string
    updated_at: string
}

export interface SeoKeyword {
    id: string
    text: string
    cluster_id: string | null
    freq: number | null
    freq_source: string | null
    freq_bucket: string | null
    city: string | null
    priority_score: number
    notes: string | null
    created_at: string
    updated_at: string
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

    /**
     * Get SEO page by path and optional city
     * Falls back to non-regional record if a specific city match is not found.
     */
    static async getSeoPageByPath(path: string, city?: string | null): Promise<SeoPage | null> {
        const client = await pool.connect()
        try {
            // Normalize input
            const normalizedPath = path.split('?')[0] || '/'
            const normalizedCity = city?.trim() || null

            // Try exact match with city first (if provided)
            let result
            if (normalizedCity) {
                result = await client.query(
                    `SELECT * FROM ${TABLES.SEO_PAGES} WHERE path = $1 AND city = $2 LIMIT 1`,
                    [normalizedPath, normalizedCity]
                )
                if (result.rows.length > 0) {
                    return result.rows[0] as SeoPage
                }
            }

            // Fallback: any record for this path
            result = await client.query(
                `SELECT * FROM ${TABLES.SEO_PAGES} WHERE path = $1 LIMIT 1`,
                [normalizedPath]
            )

            if (result.rows.length === 0) {
                return null
            }

            return result.rows[0] as SeoPage
        } catch (error) {
            console.error('Error getting SEO page by path:', error)
            throw error
        } finally {
            client.release()
        }
    }

    /**
     * Get keywords (and optional cluster) for a given path or cluster ID.
     * Used by /api/seo/keywords.
     */
    static async getSeoKeywords(params: {
        path?: string
        clusterId?: string
        intent?: string
        freqBucket?: string
        city?: string
        limit?: number
    }): Promise<{ cluster: SeoCluster | null; keywords: SeoKeyword[] }> {
        const client = await pool.connect()
        try {
            const {
                path,
                clusterId,
                intent,
                freqBucket,
                city,
                limit = 100,
            } = params

            let resolvedClusterId = clusterId || null
            let cluster: SeoCluster | null = null

            // If clusterId is not provided but path is, try to resolve via seo_pages → seo_clusters
            if (!resolvedClusterId && path) {
                const pageResult = await client.query(
                    `SELECT id FROM ${TABLES.SEO_PAGES} WHERE path = $1 LIMIT 1`,
                    [path.split('?')[0] || '/']
                )
                if (pageResult.rows.length > 0) {
                    const pageId = pageResult.rows[0].id
                    const clusterResult = await client.query(
                        `SELECT * FROM ${TABLES.SEO_CLUSTERS} WHERE seo_page_id = $1 ORDER BY priority_score DESC LIMIT 1`,
                        [pageId]
                    )
                    if (clusterResult.rows.length > 0) {
                        const c = clusterResult.rows[0] as SeoCluster
                        cluster = c
                        resolvedClusterId = c.id
                    }
                }
            }

            // If we still don't have a clusterId, return empty result
            if (!resolvedClusterId) {
                return { cluster, keywords: [] }
            }

            // Build keyword query with filters
            const conditions: string[] = ['cluster_id = $1']
            const values: any[] = [resolvedClusterId]
            let idx = 2

            if (intent) {
                conditions.push(`EXISTS (SELECT 1 FROM ${TABLES.SEO_CLUSTERS} c WHERE c.id = seo_keywords.cluster_id AND c.intent = $${idx})`)
                values.push(intent)
                idx++
            }

            if (freqBucket) {
                conditions.push(`freq_bucket = $${idx}`)
                values.push(freqBucket)
                idx++
            }

            if (city) {
                conditions.push('(city = $' + idx + ' OR city IS NULL)')
                values.push(city)
                idx++
            }

            const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

            const keywordResult = await client.query(
                `
                SELECT * FROM ${TABLES.SEO_KEYWORDS}
                ${whereClause}
                ORDER BY priority_score DESC, freq DESC NULLS LAST
                LIMIT $${idx}
                `,
                [...values, limit]
            )

            const keywords = keywordResult.rows as SeoKeyword[]

            // If cluster is still null, fetch it explicitly
            if (!cluster) {
                const clusterResult = await client.query(
                    `SELECT * FROM ${TABLES.SEO_CLUSTERS} WHERE id = $1 LIMIT 1`,
                    [resolvedClusterId]
                )
                if (clusterResult.rows.length > 0) {
                    cluster = clusterResult.rows[0] as SeoCluster
                }
            }

            return { cluster, keywords }
        } catch (error) {
            console.error('Error getting SEO keywords:', error)
            throw error
        } finally {
            client.release()
        }
    }

    /**
     * Get SEO page by ID (for admin)
     */
    static async getSeoPageById(id: string): Promise<SeoPage | null> {
        const client = await pool.connect()
        try {
            const result = await client.query(
                `SELECT * FROM ${TABLES.SEO_PAGES} WHERE id = $1 LIMIT 1`,
                [id]
            )
            return result.rows.length > 0 ? (result.rows[0] as SeoPage) : null
        } catch (error) {
            console.error('Error getting SEO page by ID:', error)
            throw error
        } finally {
            client.release()
        }
    }

    /**
     * List SEO pages with pagination (for admin)
     */
    static async listSeoPages(params: {
        page?: number
        limit?: number
    }): Promise<{ data: SeoPage[]; total: number; page: number; limit: number }> {
        const client = await pool.connect()
        try {
            const page = Math.max(1, params.page ?? 1)
            const limit = Math.min(100, Math.max(1, params.limit ?? 20))
            const offset = (page - 1) * limit

            const countResult = await client.query(
                `SELECT COUNT(*) AS total FROM ${TABLES.SEO_PAGES}`
            )
            const total = parseInt(String(countResult.rows[0].total), 10)

            const dataResult = await client.query(
                `SELECT * FROM ${TABLES.SEO_PAGES} ORDER BY path ASC LIMIT $1 OFFSET $2`,
                [limit, offset]
            )
            return {
                data: dataResult.rows as SeoPage[],
                total,
                page,
                limit,
            }
        } catch (error) {
            console.error('Error listing SEO pages:', error)
            throw error
        } finally {
            client.release()
        }
    }

    /**
     * Update SEO page (admin)
     */
    static async updateSeoPage(
        id: string,
        payload: {
            title?: string
            h1?: string
            description?: string
            h2_outline?: string[]
            faq?: string[]
            canonical_path?: string
            og_image?: string
            is_indexable?: boolean
            noindex?: boolean
        }
    ): Promise<SeoPage | null> {
        const client = await pool.connect()
        try {
            const updates: string[] = []
            const values: unknown[] = []
            let idx = 1
            if (payload.title !== undefined) {
                updates.push(`title = $${idx}`)
                values.push(payload.title)
                idx++
            }
            if (payload.h1 !== undefined) {
                updates.push(`h1 = $${idx}`)
                values.push(payload.h1)
                idx++
            }
            if (payload.description !== undefined) {
                updates.push(`description = $${idx}`)
                values.push(payload.description)
                idx++
            }
            if (payload.h2_outline !== undefined) {
                updates.push(`h2_outline = $${idx}`)
                values.push(JSON.stringify(payload.h2_outline))
                idx++
            }
            if (payload.faq !== undefined) {
                updates.push(`faq = $${idx}`)
                values.push(JSON.stringify(payload.faq))
                idx++
            }
            if (payload.canonical_path !== undefined) {
                updates.push(`canonical_path = $${idx}`)
                values.push(payload.canonical_path)
                idx++
            }
            if (payload.og_image !== undefined) {
                updates.push(`og_image = $${idx}`)
                values.push(payload.og_image)
                idx++
            }
            if (payload.is_indexable !== undefined) {
                updates.push(`is_indexable = $${idx}`)
                values.push(payload.is_indexable)
                idx++
            }
            if (payload.noindex !== undefined) {
                updates.push(`noindex = $${idx}`)
                values.push(payload.noindex)
                idx++
            }
            if (updates.length === 0) {
                return this.getSeoPageById(id)
            }
            values.push(id)
            const result = await client.query(
                `UPDATE ${TABLES.SEO_PAGES} SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
                values
            )
            return result.rows.length > 0 ? (result.rows[0] as SeoPage) : null
        } catch (error) {
            console.error('Error updating SEO page:', error)
            throw error
        } finally {
            client.release()
        }
    }

    /**
     * List SEO clusters with optional filters (for admin)
     */
    static async listSeoClusters(params: {
        page?: number
        limit?: number
        city?: string
        seoPageId?: string
    }): Promise<{ data: SeoCluster[]; total: number; page: number; limit: number }> {
        const client = await pool.connect()
        try {
            const page = Math.max(1, params.page ?? 1)
            const limit = Math.min(100, Math.max(1, params.limit ?? 20))
            const offset = (page - 1) * limit
            const conditions: string[] = []
            const values: unknown[] = []
            let idx = 1
            if (params.city) {
                conditions.push(`city = $${idx}`)
                values.push(params.city)
                idx++
            }
            if (params.seoPageId) {
                conditions.push(`seo_page_id = $${idx}`)
                values.push(params.seoPageId)
                idx++
            }
            const whereClause = conditions.length ? ' WHERE ' + conditions.join(' AND ') : ''
            const countResult = await client.query(
                `SELECT COUNT(*) AS total FROM ${TABLES.SEO_CLUSTERS}${whereClause}`,
                values
            )
            const total = parseInt(String(countResult.rows[0].total), 10)
            values.push(limit, offset)
            const dataResult = await client.query(
                `SELECT * FROM ${TABLES.SEO_CLUSTERS}${whereClause} ORDER BY priority_score DESC, name ASC LIMIT $${idx} OFFSET $${idx + 1}`,
                values
            )
            return {
                data: dataResult.rows as SeoCluster[],
                total,
                page,
                limit,
            }
        } catch (error) {
            console.error('Error listing SEO clusters:', error)
            throw error
        } finally {
            client.release()
        }
    }

    /**
     * List SEO core: keywords with cluster and page info (for admin / SEO core page)
     */
    static async getSeoCoreList(params: {
        page?: number
        limit?: number
        path?: string
        clusterId?: string
        city?: string
        intent?: string
        freqBucket?: string
        search?: string
    }): Promise<{
        data: Array<{
            id: string
            text: string
            freq: number | null
            freq_source: string | null
            freq_bucket: string | null
            city: string | null
            priority_score: number
            notes: string | null
            cluster_id: string | null
            cluster_name: string | null
            cluster_intent: string | null
            user_stage: string | null
            category_level: string | null
            cluster_city: string | null
            page_path: string | null
            page_title: string | null
        }>
        total: number
        page: number
        limit: number
    }> {
        const client = await pool.connect()
        try {
            const page = Math.max(1, params.page ?? 1)
            // Allow larger page sizes for SEO ядро (до 5000 строк за раз),
            // чтобы можно было смотреть всё семантическое ядро одной таблицей.
            const limit = Math.max(1, Math.min(params.limit ?? 50, 5000))
            const offset = (page - 1) * limit

            const conditions: string[] = ['1=1']
            const values: unknown[] = []
            let idx = 1

            if (params.path) {
                conditions.push(`p.path = $${idx}`)
                values.push(params.path)
                idx++
            }
            if (params.clusterId) {
                conditions.push(`k.cluster_id = $${idx}`)
                values.push(params.clusterId)
                idx++
            }
            if (params.city) {
                conditions.push(`(k.city = $${idx} OR c.city = $${idx})`)
                values.push(params.city)
                idx++
            }
            if (params.intent) {
                conditions.push(`c.intent = $${idx}`)
                values.push(params.intent)
                idx++
            }
            if (params.freqBucket) {
                conditions.push(`k.freq_bucket = $${idx}`)
                values.push(params.freqBucket)
                idx++
            }
            if (params.search && params.search.trim()) {
                conditions.push(`k.text ILIKE $${idx}`)
                values.push(`%${params.search.trim()}%`)
                idx++
            }

            const whereClause = ` WHERE ${conditions.join(' AND ')}`

            const countResult = await client.query(
                `SELECT COUNT(*) AS total FROM ${TABLES.SEO_KEYWORDS} k
                 LEFT JOIN ${TABLES.SEO_CLUSTERS} c ON k.cluster_id = c.id
                 LEFT JOIN ${TABLES.SEO_PAGES} p ON c.seo_page_id = p.id
                 ${whereClause}`,
                values
            )
            const total = parseInt(String(countResult.rows[0].total), 10)

            values.push(limit, offset)
            const dataResult = await client.query(
                `SELECT k.id, k.text, k.freq, k.freq_source, k.freq_bucket, k.city,
                        k.priority_score, k.notes, k.cluster_id,
                        c.name AS cluster_name, c.intent AS cluster_intent,
                        c.user_stage, c.category_level, c.city AS cluster_city,
                        p.path AS page_path, p.title AS page_title
                 FROM ${TABLES.SEO_KEYWORDS} k
                 LEFT JOIN ${TABLES.SEO_CLUSTERS} c ON k.cluster_id = c.id
                 LEFT JOIN ${TABLES.SEO_PAGES} p ON c.seo_page_id = p.id
                 ${whereClause}
                 ORDER BY k.priority_score DESC NULLS LAST, k.freq DESC NULLS LAST, k.text ASC
                 LIMIT $${idx} OFFSET $${idx + 1}`,
                values
            )

            const data = (dataResult.rows as any[]).map((row) => ({
                id: row.id,
                text: row.text,
                freq: row.freq,
                freq_source: row.freq_source,
                freq_bucket: row.freq_bucket,
                city: row.city,
                priority_score: row.priority_score ?? 0,
                notes: row.notes,
                cluster_id: row.cluster_id,
                cluster_name: row.cluster_name,
                cluster_intent: row.cluster_intent,
                user_stage: row.user_stage,
                category_level: row.category_level,
                cluster_city: row.cluster_city,
                page_path: row.page_path,
                page_title: row.page_title,
            }))

            return { data, total, page, limit }
        } catch (error) {
            console.error('Error in getSeoCoreList:', error)
            throw error
        } finally {
            client.release()
        }
    }

    /**
     * Assign or unassign a cluster to a landing page (admin)
     */
    static async updateClusterSeoPage(clusterId: string, seoPageId: string | null): Promise<SeoCluster | null> {
        const client = await pool.connect()
        try {
            const result = await client.query(
                `UPDATE ${TABLES.SEO_CLUSTERS} SET seo_page_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
                [seoPageId, clusterId]
            )
            return result.rows.length > 0 ? (result.rows[0] as SeoCluster) : null
        } catch (error) {
            console.error('Error updating cluster seo_page_id:', error)
            throw error
        } finally {
            client.release()
        }
    }
}


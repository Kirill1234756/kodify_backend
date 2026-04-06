/**
 * Import SEO semantic core from CSV (Kodify format).
 * CSV columns: keyword, intent, user_stage, category_level, city, cluster_id, freq, freq_source, freq_bucket, priority_score, page_type, example_h1, notes
 * Delimiter: comma.
 * Maps clusters to existing site paths (seo_pages) by keyword/city/page_type/notes.
 *
 * Run: npm run db:import-seo -- "C:\path\to\file.csv"
 * When .env has DB_HOST=postgres (Docker), scripts use localhost so you can run from host.
 */
import './dotenv-local'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse'
import { pool, TABLES } from '../src/config/database'

type RawKeywordRow = {
    keyword: string
    intent?: string
    user_stage?: string
    category_level?: string
    city?: string
    cluster_id?: string
    freq?: string
    freq_source?: string
    freq_bucket?: string
    priority_score?: string
    page_type?: string
    example_h1?: string
    notes?: string
}

/** Map CSV row to our site path (canonical URL) based on keyword, city, page_type, notes. */
function getPathForRow(row: RawKeywordRow): string {
    const k = (row.keyword || '').toLowerCase()
    const city = (row.city || '').trim()
    const notes = (row.notes || '').toLowerCase()
    const pageType = (row.page_type || '').toLowerCase()

    // Local (Липецк) — growth vs development by intent
    if (city === 'Липецк') {
        if (/продвижен|seo|реклам|контекст|метрик|аналитик|директ/.test(k)) return '/services/growth/lipetsk'
        return '/services/development/lipetsk'
    }
    if (city === 'Москва') {
        if (/продвижен|seo|реклам|контекст/.test(k)) return '/services/growth/moscow'
        return '/services/development/moscow'
    }
    if (city === 'Санкт-Петербург' || city === 'СПб') {
        if (/продвижен|seo|реклам|контекст/.test(k)) return '/services/growth/spb'
        return '/services/development/spb'
    }

    // Niche: construction companies
    if (row.category_level === 'niche' || /строительн|застройщик|калькулятор стоимости дома|портфолио строительн|галерея проект|виртуальная экскурсия|контент для сайта строительн|тексты для сайта строитель|форма заявки для строителей|кровельные работы/.test(k) || /niche: construction|construction companies/.test(notes)) {
        return '/services/development/construction'
    }

    // Growth / promotion
    if (/продвижение сайта|seo продвижен|seo оптимизац|контекстная реклама|настройка яндекс директ|маркетинг|аудит маркетинг|исследовани.*бизнес|анализ рынка|анализ конкурент/.test(k)) {
        if (/стратеги|брендинг|бизнес-план|маркетинговую стратегию/.test(k)) return '/services/strategy'
        if (/маркетинговую стратегию|маркетинговая стратегия/.test(k)) return '/services/growth/marketing-strategy'
        if (/аудит маркетинг/.test(k)) return '/services/growth/marketing-audit'
        if (/исследовани|анализ рынка/.test(k)) return '/services/growth/market-analysis'
        if (/анализ конкурент/.test(k)) return '/services/growth/competitor-analysis'
        return '/services/growth/promotion'
    }

    // Strategy
    if (/стратеги|брендинг|бизнес-план/.test(k)) {
        if (/бизнес-план|бизнес план/.test(k)) return '/services/strategy/business-plan'
        if (/предварительн.*стратеги/.test(k)) return '/services/strategy/preliminary-marketing-strategy'
        return '/services/strategy/branding'
    }

    // Development — specific services
    if (/интернет магазин|интернет-магазин|создание интернет|e-commerce/.test(k)) return '/services/development/online-store'
    if (/корпоративн/.test(k)) return '/services/development/corporate-website'
    if (/лендинг/.test(k)) return '/services/development/landing-page'
    if (/saas|саас/.test(k)) return '/services/development/saas-solutions'
    if (/crm|битрикс|amocrm|1с/.test(k)) return '/services/development/crm-integration'
    if (/автоматизац|чат-бот|онлайн-консультант/.test(k)) return '/services/development/business-automation'
    if (/визитк/.test(k)) return '/services/development/business-card-site'
    if (/каталог сайт/.test(k)) return '/services/development/site-catalog'
    if (/интеграц.*внешн|внешн.*сервис/.test(k)) return '/services/development/site-integration'
    if (/мобильн|приложен/.test(k)) return '/services/development' // no dedicated mobile page

    // Cost / calculator
    if (/сколько стоит|стоимость разработки|цена разработки|калькулятор/.test(k) && pageType !== 'category') {
        return '/calculator'
    }

    // Blog / informational — land on blog index or development
    if (pageType === 'blog_post') return '/blog'
    if (/как созда|как сдела|как разработать|как выбра|как заказать|как настроить|что такое|зачем нужен|почему сайт|этапы создан|чек лист|ошибки при создании/.test(k)) return '/blog'

    // Default: development
    return '/services/development'
}

async function importSeoCsv(filePath: string) {
    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        const clustersByKey = new Map<string, string>() // "clusterId::city::path" -> our cluster UUID
        const clusterNames = new Map<string, string>() // "clusterId::city" -> example_h1 or first keyword
        const pagesCache = new Map<string, string>()

        const resolvePage = async (pathNorm: string): Promise<string | null> => {
            if (pagesCache.has(pathNorm)) return pagesCache.get(pathNorm)!
            const existing = await client.query(
                `SELECT id FROM ${TABLES.SEO_PAGES} WHERE path = $1 LIMIT 1`,
                [pathNorm]
            )
            if (existing.rows.length > 0) {
                const id = existing.rows[0].id as string
                pagesCache.set(pathNorm, id)
                return id
            }
            const insert = await client.query(
                `INSERT INTO ${TABLES.SEO_PAGES} (path, page_type, title, is_indexable, noindex)
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [pathNorm, 'service_detail', pathNorm, true, false]
            )
            const id = insert.rows[0].id as string
            pagesCache.set(pathNorm, id)
            return id
        }

        const rows: RawKeywordRow[] = []
        const parser = fs.createReadStream(filePath).pipe(
            parse({
                columns: true,
                skip_empty_lines: true,
                delimiter: ',',
                trim: true,
                relax_column_count: true,
            })
        )
        for await (const record of parser) {
            const r = record as RawKeywordRow
            if (r.keyword) rows.push(r)
        }

        // Build cluster names from first example_h1 per cluster_id::city
        for (const row of rows) {
            const cid = String(row.cluster_id ?? '')
            const city = (row.city || '').trim()
            const key = `${cid}::${city}`
            if (!clusterNames.has(key) && (row.example_h1 || row.keyword)) {
                clusterNames.set(key, (row.example_h1 || row.keyword).slice(0, 255))
            }
        }

        let imported = 0
        for (const row of rows) {
            const cid = String(row.cluster_id ?? '')
            const city = (row.city || '').trim()
            const pathNorm = getPathForRow(row)
            const clusterKey = `${cid}::${city}::${pathNorm}`
            const clusterName = clusterNames.get(`${cid}::${city}`) || row.keyword?.slice(0, 255) || `cluster_${cid}`

            let clusterUuid = clustersByKey.get(clusterKey)
            if (!clusterUuid) {
                const pageId = await resolvePage(pathNorm)
                const existing = await client.query(
                    `SELECT id FROM ${TABLES.SEO_CLUSTERS} WHERE name = $1 AND COALESCE(city, '') = COALESCE($2, '') AND (seo_page_id = $3 OR (seo_page_id IS NULL AND $3 IS NULL)) LIMIT 1`,
                    [clusterName, city || null, pageId]
                )
                if (existing.rows.length > 0) {
                    clusterUuid = existing.rows[0].id as string
                } else {
                    const insert = await client.query(
                        `INSERT INTO ${TABLES.SEO_CLUSTERS} (name, intent, user_stage, category_level, city, priority_score, seo_page_id)
                         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                        [
                            clusterName,
                            row.intent || null,
                            row.user_stage || null,
                            row.category_level || null,
                            city || null,
                            row.priority_score ? parseInt(row.priority_score, 10) || 0 : 0,
                            pageId,
                        ]
                    )
                    clusterUuid = insert.rows[0].id as string
                }
                clustersByKey.set(clusterKey, clusterUuid)
            }

            const freqNum = row.freq ? parseInt(row.freq, 10) : null
            const priority = row.priority_score ? parseInt(row.priority_score, 10) || 0 : 0
            const exists = await client.query(
                `SELECT 1 FROM ${TABLES.SEO_KEYWORDS} WHERE LOWER(TRIM(text)) = LOWER(TRIM($1)) AND (cluster_id IS NOT DISTINCT FROM $2) LIMIT 1`,
                [row.keyword, clusterUuid]
            )
            if (exists.rows.length > 0) continue
            await client.query(
                `INSERT INTO ${TABLES.SEO_KEYWORDS} (text, cluster_id, freq, freq_source, freq_bucket, city, priority_score, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    row.keyword,
                    clusterUuid,
                    Number.isNaN(freqNum) ? null : freqNum,
                    row.freq_source || null,
                    row.freq_bucket || null,
                    city || null,
                    priority,
                    (row.notes || '').slice(0, 1000),
                ]
            )
            imported++
            if (imported % 300 === 0) console.log(`Imported ${imported} keywords...`)
        }

        await client.query('COMMIT')
        console.log(`✅ Import completed. Total keywords: ${imported}, clusters: ${clustersByKey.size}`)
    } catch (e) {
        await client.query('ROLLBACK')
        console.error('❌ Error importing SEO CSV:', e)
        process.exit(1)
    } finally {
        client.release()
        await pool.end()
    }
}

async function main() {
    const fileArg = process.argv[2]
    if (!fileArg) {
        console.error('Usage: npx ts-node scripts/import-seo-csv.ts <path-to-csv>')
        console.error('Example: npx ts-node scripts/import-seo-csv.ts "C:\\Users\\user\\Desktop\\SEO_Ядро_Kodify_FINAL_1073_запросов.csv"')
        process.exit(1)
    }
    const csvPath = path.resolve(process.cwd(), fileArg)
    if (!fs.existsSync(csvPath)) {
        console.error('File not found:', csvPath)
        process.exit(1)
    }
    console.log('Starting SEO CSV import from:', csvPath)
    await importSeoCsv(csvPath)
}

void main()

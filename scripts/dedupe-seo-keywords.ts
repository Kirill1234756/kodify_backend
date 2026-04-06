/**
 * Remove duplicate SEO keywords: same normalized text within the same cluster.
 * Keeps one row per (LOWER(TRIM(text)), cluster_id) — prefer non-null freq, then max freq, then oldest created_at.
 *
 * Run: npm run db:dedupe-seo
 */
import './dotenv-local'
import { pool, TABLES } from '../src/config/database'

async function dedupe() {
    const client = await pool.connect()
    try {
        // Count duplicates before
        const countBefore = await client.query(
            `SELECT COUNT(*) AS c FROM ${TABLES.SEO_KEYWORDS}`
        )
        const totalBefore = parseInt(countBefore.rows[0].c, 10)

        const dupGroups = await client.query(`
            SELECT LOWER(TRIM(text)) AS ntext, cluster_id, COUNT(*) AS cnt
            FROM ${TABLES.SEO_KEYWORDS}
            GROUP BY LOWER(TRIM(text)), cluster_id
            HAVING COUNT(*) > 1
        `)
        const duplicateGroups = dupGroups.rows.length
        const duplicateRows = dupGroups.rows.reduce((sum: number, r: { cnt: string }) => sum + parseInt(r.cnt, 10), 0) - duplicateGroups

        if (duplicateGroups === 0) {
            console.log('No duplicate keyword groups found. Total keywords:', totalBefore)
            return
        }

        console.log(`Found ${duplicateGroups} duplicate groups (${duplicateRows} rows to remove).`)

        await client.query('BEGIN')

        const deleteResult = await client.query(`
            WITH normalized AS (
                SELECT id,
                       LOWER(TRIM(text)) AS ntext,
                       cluster_id,
                       freq,
                       created_at,
                       ROW_NUMBER() OVER (
                           PARTITION BY LOWER(TRIM(text)), cluster_id
                           ORDER BY (freq IS NULL), freq DESC NULLS LAST, created_at ASC
                       ) AS rn
                FROM ${TABLES.SEO_KEYWORDS}
            ),
            to_delete AS (
                SELECT id FROM normalized WHERE rn > 1
            )
            DELETE FROM ${TABLES.SEO_KEYWORDS}
            WHERE id IN (SELECT id FROM to_delete)
        `)

        await client.query('COMMIT')

        const countAfter = await client.query(
            `SELECT COUNT(*) AS c FROM ${TABLES.SEO_KEYWORDS}`
        )
        const totalAfter = parseInt(countAfter.rows[0].c, 10)
        const removed = totalBefore - totalAfter

        console.log(`Removed ${removed} duplicate keywords. Remaining: ${totalAfter}.`)
    } catch (e) {
        await client.query('ROLLBACK').catch(() => { })
        console.error('Deduplication failed:', e)
        process.exit(1)
    } finally {
        client.release()
        await pool.end()
    }
}

void dedupe()

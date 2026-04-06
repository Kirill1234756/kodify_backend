/**
 * Update freq / freq_source / freq_bucket for seo_keywords using external API.
 *
 * Run from backend:
 *   npm run db:update-freq
 *
 * Configure provider via:
 *  - KEYWORD_FREQ_API_URL
 *  - KEYWORD_FREQ_API_KEY
 */
import dotenv from 'dotenv'
import { pool, TABLES } from '../src/config/database'
import {
  fetchKeywordFrequencies,
  type KeywordFrequencyInput,
} from '../src/services/keywordFrequencyService'

dotenv.config()

async function updateFrequencies(batchSize = 200) {
  const client = await pool.connect()
  try {
    console.log('🔍 Selecting keywords without frequency...')
    const selectRes = await client.query(
      `SELECT id, text, city
       FROM ${TABLES.SEO_KEYWORDS}
       WHERE freq IS NULL
       ORDER BY priority_score DESC, created_at ASC
       LIMIT $1`,
      [batchSize],
    )

    if (selectRes.rows.length === 0) {
      console.log('✅ No keywords without frequency. Nothing to update.')
      return
    }

    const items: KeywordFrequencyInput[] = selectRes.rows.map((row) => ({
      id: row.id as string,
      keyword: row.text as string,
      city: (row.city as string | null) || null,
    }))

    console.log(`📦 Fetching frequency for ${items.length} keywords...`)
    const results = await fetchKeywordFrequencies(items)
    if (!results.length) {
      console.log('⚠️ Frequency provider returned no data. Check KEYWORD_FREQ_* env and mapping.')
      return
    }

    console.log('💾 Applying updates to database...')
    await client.query('BEGIN')
    for (const r of results) {
      await client.query(
        `UPDATE ${TABLES.SEO_KEYWORDS}
         SET freq = $1,
             freq_source = $2,
             freq_bucket = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [r.freq, r.source, r.bucket, r.id],
      )
    }
    await client.query('COMMIT')
    console.log(`✅ Updated ${results.length} keywords with fresh frequency.`)
  } catch (error) {
    console.error('❌ Error updating SEO keyword frequencies:', error)
    try {
      await pool.query('ROLLBACK')
    } catch {
      // ignore
    }
    process.exitCode = 1
  } finally {
    client.release()
  }
}

async function main() {
  await updateFrequencies()
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})


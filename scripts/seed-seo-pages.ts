/**
 * Seed seo_pages from frontend src/config/seo.ts.
 * Run from backend: npm run db:seed-seo  (or: npx ts-node scripts/seed-seo-pages.ts)
 * Reads frontend/src/config/seo.ts, extracts seoConfig, and upserts into seo_pages.
 * When .env has DB_HOST=postgres (Docker), scripts use localhost so you can run from host.
 */
import './dotenv-local'
import fs from 'fs'
import path from 'path'
import { pool, TABLES } from '../src/config/database'

type SeoConfigEntry = {
  title: string
  h1: string
  description: string
  h2Outline: string[]
  faq: string[]
  canonicalPath: string
  ogImage?: string
}

function getPageTypeAndCity(pagePath: string): { page_type: string; city: string | null } {
  if (pagePath.includes('/lipetsk')) return { page_type: 'local_landing', city: 'lipetsk' }
  if (pagePath.includes('/moscow')) return { page_type: 'local_landing', city: 'moscow' }
  if (pagePath.includes('/spb')) return { page_type: 'local_landing', city: 'spb' }
  if (pagePath === '/calculator') return { page_type: 'calculator', city: null }
  if (pagePath === '/packages') return { page_type: 'packages', city: null }
  if (pagePath === '/services') return { page_type: 'service_category', city: null }
  if (
    pagePath === '/services/development' ||
    pagePath === '/services/growth' ||
    pagePath === '/services/strategy' ||
    pagePath === '/services/development-launch' ||
    pagePath === '/services/analytics-research' ||
    pagePath === '/services/strategy-positioning' ||
    pagePath === '/services/automation-growth'
  ) {
    return { page_type: 'service_category', city: null }
  }
  return { page_type: 'service_detail', city: null }
}

function extractSeoConfigFromTs(filePath: string): Record<string, SeoConfigEntry> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const startMarker = 'export const seoConfig: Record<string, SEOConfig> = '
  const start = content.indexOf(startMarker)
  if (start === -1) throw new Error('seoConfig not found in file')
  let pos = start + startMarker.length
  let depth = 0
  let end = pos
  for (let i = pos; i < content.length; i++) {
    const ch = content[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        end = i + 1
        break
      }
    }
  }
  const objStr = content.substring(pos, end)
  // eslint-disable-next-line no-eval
  return eval('(' + objStr + ')') as Record<string, SeoConfigEntry>
}

async function seedSeoPages() {
  const frontendSeoPath = path.resolve(__dirname, '../../frontend/src/config/seo.ts')
  if (!fs.existsSync(frontendSeoPath)) {
    console.error('Frontend seo.ts not found at:', frontendSeoPath)
    process.exit(1)
  }

  const seoConfig = extractSeoConfigFromTs(frontendSeoPath)
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    let upserted = 0

    for (const [pagePath, entry] of Object.entries(seoConfig)) {
      const { page_type, city } = getPageTypeAndCity(pagePath)
      const h2Outline = Array.isArray(entry.h2Outline) ? entry.h2Outline : []
      const faq = Array.isArray(entry.faq) ? entry.faq : []
      const canonicalPath = entry.canonicalPath || pagePath
      const ogImage = entry.ogImage || '/og-image.webp'

      await client.query(
        `INSERT INTO ${TABLES.SEO_PAGES} (
          path, page_type, title, h1, description,
          h2_outline, faq, canonical_path, og_image,
          is_indexable, noindex, city, region_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (path) DO UPDATE SET
          page_type = EXCLUDED.page_type,
          title = EXCLUDED.title,
          h1 = EXCLUDED.h1,
          description = EXCLUDED.description,
          h2_outline = EXCLUDED.h2_outline,
          faq = EXCLUDED.faq,
          canonical_path = EXCLUDED.canonical_path,
          og_image = EXCLUDED.og_image,
          city = EXCLUDED.city,
          region_type = EXCLUDED.region_type,
          updated_at = NOW()`,
        [
          pagePath,
          page_type,
          entry.title,
          entry.h1,
          entry.description,
          JSON.stringify(h2Outline),
          JSON.stringify(faq),
          canonicalPath,
          ogImage,
          true,
          false,
          city,
          city ? 'city' : null,
        ]
      )
      upserted++
    }

    await client.query('COMMIT')
    console.log(`✅ SEO pages seed done. Upserted: ${upserted} entries.`)
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('Seed failed:', e)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seedSeoPages()

import axios from 'axios'

export type KeywordFrequencyInput = {
    id: string
    keyword: string
    city?: string | null
}

export type KeywordFrequencyResult = {
    id: string
    keyword: string
    freq: number | null
    bucket: string | null
    source: string | null
}

function bucketByFreq(freq: number | null): string | null {
    if (freq == null || Number.isNaN(freq)) return null
    if (freq >= 10000) return 'HF'
    if (freq >= 1000) return 'MF'
    if (freq > 0) return 'LF'
    return null
}

/**
 * Generic frequency service.
 *
 * IMPORTANT: this is intentionally provider-agnostic.
 * Configure it via env:
 *  - KEYWORD_FREQ_API_URL  – endpoint of your provider
 *  - KEYWORD_FREQ_API_KEY  – API key/token
 *
 * Expected request shape (you can adapt it to your provider):
 *  POST KEYWORD_FREQ_API_URL
 *  {
 *    apiKey: '...',
 *    keywords: [{ keyword: string, city?: string }]
 *  }
 *
 * Expected response shape (adapt mapping inside this file):
 *  {
 *    data: [
 *      { keyword: string, volume: number }
 *    ]
 *  }
 */
export async function fetchKeywordFrequencies(
    items: KeywordFrequencyInput[]
): Promise<KeywordFrequencyResult[]> {
    const apiUrl = process.env.KEYWORD_FREQ_API_URL
    const apiKey = process.env.KEYWORD_FREQ_API_KEY

    if (!apiUrl || !apiKey) {
        console.warn(
            '[keywordFrequencyService] KEYWORD_FREQ_API_URL or KEYWORD_FREQ_API_KEY is not set. ' +
            'Frequency update is skipped.'
        )
        return []
    }

    if (items.length === 0) return []

    try {
        const payload = {
            apiKey,
            keywords: items.map((k) => ({
                keyword: k.keyword,
                city: k.city || undefined,
            })),
        }

        const resp = await axios.post(apiUrl, payload, {
            timeout: 15000,
        })

        // Adapt this mapping to your provider's response format.
        const raw = resp.data?.data ?? []

        const byKeyword = new Map<string, number>()
        for (const row of raw as Array<{ keyword?: string; volume?: number }>) {
            if (!row || !row.keyword) continue
            const vol = typeof row.volume === 'number' ? row.volume : null
            byKeyword.set(row.keyword.toLowerCase(), vol ?? 0)
        }

        return items.map((item) => {
            const freq = byKeyword.get(item.keyword.toLowerCase()) ?? null
            return {
                id: item.id,
                keyword: item.keyword,
                freq,
                bucket: bucketByFreq(freq),
                source: 'external_api',
            }
        })
    } catch (error) {
        console.error('[keywordFrequencyService] Error fetching frequencies:', error)
        return []
    }
}


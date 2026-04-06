-- Prevent duplicate keywords per cluster: same normalized text only once per cluster_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_seo_keywords_text_cluster_unique
    ON seo_keywords (LOWER(TRIM(text)), cluster_id);

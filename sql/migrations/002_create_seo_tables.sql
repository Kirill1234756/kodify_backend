-- Migration: Create SEO-related tables for semantic core
-- Run this script in your PostgreSQL database after 001_create_tables.sql

-- Ensure UUID extension is enabled (safe no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: seo_pages
-- Stores per-URL SEO configuration (meta, H1, outlines, FAQ, regional flags)
CREATE TABLE IF NOT EXISTS seo_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- URL and type
    path VARCHAR(500) NOT NULL UNIQUE,
    page_type VARCHAR(50) NOT NULL, -- home, service_category, service_detail, blog_post, blog_category, case, local_landing, calculator, packages, form, contacts

    -- Main meta content
    title TEXT NOT NULL,
    h1 TEXT,
    description TEXT,

    -- Structured content helpers
    h2_outline JSONB NOT NULL DEFAULT '[]'::jsonb,
    faq JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Technical SEO
    canonical_path VARCHAR(500),
    og_image VARCHAR(500),
    is_indexable BOOLEAN NOT NULL DEFAULT TRUE,
    noindex BOOLEAN NOT NULL DEFAULT FALSE,

    -- Regional targeting
    city VARCHAR(100),
    region_type VARCHAR(50) -- e.g. city, region, country
);

-- Table: seo_clusters
-- Logical keyword clusters mapped to landing pages
CREATE TABLE IF NOT EXISTS seo_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    name VARCHAR(255) NOT NULL,

    -- Funnel / intent classification
    intent VARCHAR(50),          -- informational, commercial, transactional, navigational, service, etc.
    user_stage VARCHAR(50),      -- awareness, consideration, decision, retention
    category_level VARCHAR(50),  -- general, niche, local, etc.

    -- Regional targeting
    city VARCHAR(100),

    -- Priority for content/SEO work
    priority_score INTEGER NOT NULL DEFAULT 0,

    -- Mapped landing page
    seo_page_id UUID REFERENCES seo_pages(id) ON DELETE SET NULL
);

-- Table: seo_keywords
-- Raw keywords from the semantic core, grouped into clusters
CREATE TABLE IF NOT EXISTS seo_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    text VARCHAR(255) NOT NULL,

    cluster_id UUID REFERENCES seo_clusters(id) ON DELETE SET NULL,

    -- Frequency and source (e.g. Wordstat, Ahrefs)
    freq INTEGER,
    freq_source VARCHAR(100),
    freq_bucket VARCHAR(10), -- HF / MF / LF or similar

    -- Regional info (can differ from cluster.city for more granular cases)
    city VARCHAR(100),

    -- Priority fine-tuning and notes
    priority_score INTEGER NOT NULL DEFAULT 0,
    notes TEXT
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seo_pages_path ON seo_pages(path);
CREATE INDEX IF NOT EXISTS idx_seo_pages_page_type ON seo_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_seo_pages_city ON seo_pages(city);

CREATE INDEX IF NOT EXISTS idx_seo_clusters_name ON seo_clusters(name);
CREATE INDEX IF NOT EXISTS idx_seo_clusters_city ON seo_clusters(city);
CREATE INDEX IF NOT EXISTS idx_seo_clusters_seo_page_id ON seo_clusters(seo_page_id);

CREATE INDEX IF NOT EXISTS idx_seo_keywords_text ON seo_keywords(text);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_cluster_id ON seo_keywords(cluster_id);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_freq_bucket ON seo_keywords(freq_bucket);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_city ON seo_keywords(city);

-- Reuse existing updated_at trigger function from 001_create_tables.sql
-- Create triggers for SEO tables
DROP TRIGGER IF EXISTS trg_seo_pages_updated ON seo_pages;
CREATE TRIGGER trg_seo_pages_updated
    BEFORE UPDATE ON seo_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_seo_clusters_updated ON seo_clusters;
CREATE TRIGGER trg_seo_clusters_updated
    BEFORE UPDATE ON seo_clusters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_seo_keywords_updated ON seo_keywords;
CREATE TRIGGER trg_seo_keywords_updated
    BEFORE UPDATE ON seo_keywords
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


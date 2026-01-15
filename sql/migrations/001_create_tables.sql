-- Migration: Create tables for IT Company backend
-- Run this script in your PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table for detailed client forms
CREATE TABLE IF NOT EXISTS client_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    company_description TEXT NOT NULL,
    task TEXT NOT NULL,
    solution_vision TEXT NOT NULL,
    expectations TEXT NOT NULL,
    budget TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    
    attached_file_url TEXT,
    attached_file_name VARCHAR(255),
    attached_file_size INTEGER,
    
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    source VARCHAR(50) NOT NULL DEFAULT 'client_form',
    bitrix_lead_id INTEGER
);

-- Table for contact forms
CREATE TABLE IF NOT EXISTS contact_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    source VARCHAR(50) NOT NULL DEFAULT 'contact_section',
    bitrix_lead_id INTEGER
);

-- Table for calculator forms
CREATE TABLE IF NOT EXISTS calculator_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contact info
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    
    -- Calculator data
    site_type TEXT NOT NULL,
    pages TEXT,
    design TEXT NOT NULL,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    content TEXT NOT NULL,
    seo TEXT NOT NULL,
    ads BOOLEAN NOT NULL DEFAULT false,
    urgency TEXT NOT NULL,
    support TEXT NOT NULL,
    
    -- Pricing
    calculated_price NUMERIC NOT NULL DEFAULT 0,
    min_price NUMERIC NOT NULL DEFAULT 0,
    max_price NUMERIC NOT NULL DEFAULT 0,
    timeline TEXT NOT NULL DEFAULT '',
    
    -- Meta
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    source VARCHAR(50) NOT NULL DEFAULT 'calculator',
    bitrix_lead_id INTEGER
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_forms_created_at ON client_forms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_forms_status ON client_forms(status);
CREATE INDEX IF NOT EXISTS idx_client_forms_source ON client_forms(source);

CREATE INDEX IF NOT EXISTS idx_contact_forms_created_at ON contact_forms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_forms_status ON contact_forms(status);
CREATE INDEX IF NOT EXISTS idx_contact_forms_source ON contact_forms(source);

CREATE INDEX IF NOT EXISTS idx_calculator_forms_created_at ON calculator_forms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculator_forms_status ON calculator_forms(status);
CREATE INDEX IF NOT EXISTS idx_calculator_forms_source ON calculator_forms(source);
CREATE INDEX IF NOT EXISTS idx_calculator_forms_features_gin ON calculator_forms USING gin(features);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
DROP TRIGGER IF EXISTS trg_client_forms_updated ON client_forms;
CREATE TRIGGER trg_client_forms_updated
    BEFORE UPDATE ON client_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_contact_forms_updated ON contact_forms;
CREATE TRIGGER trg_contact_forms_updated
    BEFORE UPDATE ON contact_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_calculator_forms_updated ON calculator_forms;
CREATE TRIGGER trg_calculator_forms_updated
    BEFORE UPDATE ON calculator_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();














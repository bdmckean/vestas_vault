-- Migration: Add Partner/Spouse Social Security support
-- Run this if you have an existing database and added the spouse SS feature.
-- PostgreSQL (use IF NOT EXISTS if your version supports it; otherwise run once manually).

-- Social Security: spouse fields
ALTER TABLE social_security ADD COLUMN IF NOT EXISTS spouse_birth_date DATE;
ALTER TABLE social_security ADD COLUMN IF NOT EXISTS spouse_fra_monthly_amount NUMERIC(10,2);
ALTER TABLE social_security ADD COLUMN IF NOT EXISTS spouse_fra_age NUMERIC(4,2);
ALTER TABLE social_security ADD COLUMN IF NOT EXISTS spouse_benefit_source VARCHAR(20) DEFAULT 'own';

-- Social Security: default scenario SS start ages
ALTER TABLE social_security ADD COLUMN IF NOT EXISTS default_ss_start_age_years INTEGER;
ALTER TABLE social_security ADD COLUMN IF NOT EXISTS default_ss_start_age_months INTEGER;
ALTER TABLE social_security ADD COLUMN IF NOT EXISTS default_spouse_ss_start_age_years INTEGER;
ALTER TABLE social_security ADD COLUMN IF NOT EXISTS default_spouse_ss_start_age_months INTEGER;

-- Saved scenarios: spouse SS start age
ALTER TABLE saved_scenarios ADD COLUMN IF NOT EXISTS spouse_ss_start_age_years INTEGER;
ALTER TABLE saved_scenarios ADD COLUMN IF NOT EXISTS spouse_ss_start_age_months INTEGER;

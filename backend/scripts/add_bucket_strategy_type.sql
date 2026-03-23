-- Migration: Add bucket strategy type (A vs B)
-- Run once; safe to re-run with IF NOT EXISTS.
-- PostgreSQL.

ALTER TABLE saved_scenarios ADD COLUMN IF NOT EXISTS bucket_strategy_type VARCHAR(1) NOT NULL DEFAULT 'A';

COMMENT ON COLUMN saved_scenarios.bucket_strategy_type IS 'A=3yr cash/4yr balanced (50/50), B=1yr cash/5yr bonds only';

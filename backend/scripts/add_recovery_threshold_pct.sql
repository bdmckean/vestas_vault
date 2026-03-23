-- Migration: Add recovery_threshold_pct for bucket strategy recovery definition
-- Recovery = bucket 3 at or above this % of previous high (default 100 = return to previous high).
-- Run once if you have an existing database.
-- Example: psql -U $POSTGRES_USER -d $POSTGRES_DB -f add_recovery_threshold_pct.sql

ALTER TABLE saved_scenarios ADD COLUMN IF NOT EXISTS recovery_threshold_pct NUMERIC(5,2) NOT NULL DEFAULT 100;

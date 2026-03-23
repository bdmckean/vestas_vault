-- Migration: Add state of residence to tax_config for state income tax
-- CO = Colorado (SS exempt for 65+); OTHER = flat rate on federal taxable.
-- Run once if you have an existing database.
-- Example: psql -U $POSTGRES_USER -d $POSTGRES_DB -f add_tax_config_state.sql

ALTER TABLE tax_config ADD COLUMN IF NOT EXISTS state VARCHAR(10) DEFAULT 'CO';

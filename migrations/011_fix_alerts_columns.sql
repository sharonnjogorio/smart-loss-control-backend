-- Migration: Add missing columns to alerts table
-- Purpose: alerts table was created without type, severity, message, metadata, resolved_at

ALTER TABLE alerts ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'VARIANCE_DETECTED';
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'WARNING';
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;

DO $$
BEGIN
  RAISE NOTICE 'Migration 011: alerts columns added successfully';
END $$;

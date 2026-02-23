-- ============================================
-- Add soft delete support for SKUs
-- Migration: 006_add_sku_soft_delete.sql
-- ============================================

-- Add is_active column to skus table
ALTER TABLE skus 
ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL;

-- Add discontinued_at timestamp
ALTER TABLE skus
ADD COLUMN discontinued_at TIMESTAMP;

-- Add index for active SKUs (most queries will filter by this)
CREATE INDEX idx_skus_is_active ON skus(is_active);

COMMENT ON COLUMN skus.is_active IS 'Whether this SKU is currently active (false = discontinued/deleted)';
COMMENT ON COLUMN skus.discontinued_at IS 'When this SKU was discontinued/soft-deleted';

-- ============================================
-- Add supplier_name to restocks table
-- Migration: 005_add_supplier_name.sql
-- ============================================

-- Add supplier_name column to restocks table
ALTER TABLE restocks 
ADD COLUMN supplier_name VARCHAR(150);

-- Add index for supplier name queries
CREATE INDEX idx_restocks_supplier_name ON restocks(supplier_name);

COMMENT ON COLUMN restocks.supplier_name IS 'Name of the supplier who delivered the stock (e.g., "Lagos Distributors Ltd")';

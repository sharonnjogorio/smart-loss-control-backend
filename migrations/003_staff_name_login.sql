-- ============================================
-- Smart Loss Control - Staff Name Login
-- Migration: 003_staff_name_login.sql
-- Purpose: Allow staff to login with name instead of phone
-- ============================================

-- ============================================
-- ADD UNIQUE CONSTRAINT ON STAFF NAME PER SHOP
-- ============================================

-- Create unique index for staff names within each shop
-- This ensures no two staff members in the same shop have the same name
CREATE UNIQUE INDEX IF NOT EXISTS unique_staff_name_per_shop 
ON users(shop_id, full_name) 
WHERE role = 'STAFF';

COMMENT ON INDEX unique_staff_name_per_shop IS 'Ensures staff names are unique within each shop for name-based login';

-- ============================================
-- MAKE PHONE OPTIONAL FOR STAFF
-- ============================================

-- Phone is now optional for staff (they login with name + PIN)
-- Phone is still required for owners (they use phone + OTP)

COMMENT ON COLUMN users.phone IS 'Required for OWNER (OTP login), Optional for STAFF (name + PIN login)';

-- ============================================
-- VERIFICATION QUERIES (FOR TESTING)
-- ============================================

-- Test unique constraint exists
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'users' AND indexname = 'unique_staff_name_per_shop';

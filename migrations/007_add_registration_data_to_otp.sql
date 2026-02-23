-- Migration 007: Add registration data to otp_verifications table
-- Purpose: Store registration data temporarily until OTP is verified
-- This allows creating users AFTER OTP verification (better security)

ALTER TABLE otp_verifications
ADD COLUMN full_name VARCHAR(150),
ADD COLUMN shop_name VARCHAR(150);

COMMENT ON COLUMN otp_verifications.full_name IS 'Temporary storage of owner full name during registration (before OTP verification)';
COMMENT ON COLUMN otp_verifications.shop_name IS 'Temporary storage of shop name during registration (before OTP verification)';

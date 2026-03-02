-- Migration: Add Account Lockout Tables
-- Purpose: Track failed login attempts and lock accounts after multiple failures
-- Date: February 2026

-- Create failed_login_attempts table
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  attempt_time TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create account_locks table
CREATE TABLE IF NOT EXISTS account_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  locked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  locked_until TIMESTAMP NOT NULL,
  reason VARCHAR(100) NOT NULL,
  unlock_token VARCHAR(64) UNIQUE,
  unlocked_at TIMESTAMP,
  unlocked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_failed_attempts_user_id ON failed_login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_failed_attempts_phone ON failed_login_attempts(phone);
CREATE INDEX IF NOT EXISTS idx_failed_attempts_time ON failed_login_attempts(attempt_time DESC);
CREATE INDEX IF NOT EXISTS idx_account_locks_user_id ON account_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_account_locks_active ON account_locks(locked_until) WHERE unlocked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_account_locks_token ON account_locks(unlock_token) WHERE unlock_token IS NOT NULL;

-- Add comments
COMMENT ON TABLE failed_login_attempts IS 'Tracks all failed login attempts for security monitoring';
COMMENT ON TABLE account_locks IS 'Tracks account lockouts due to security violations';
COMMENT ON COLUMN account_locks.unlock_token IS 'Token sent to user for manual unlock';
COMMENT ON COLUMN account_locks.locked_until IS 'Automatic unlock time';

-- Create function to check if account is locked
CREATE OR REPLACE FUNCTION is_account_locked(p_user_id UUID)
RETURNS TABLE (
  is_locked BOOLEAN,
  locked_until TIMESTAMP,
  minutes_remaining INTEGER,
  reason VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as is_locked,
    al.locked_until,
    CEIL(EXTRACT(EPOCH FROM (al.locked_until - NOW())) / 60)::INTEGER as minutes_remaining,
    al.reason
  FROM account_locks al
  WHERE al.user_id = p_user_id
    AND al.locked_until > NOW()
    AND al.unlocked_at IS NULL
  ORDER BY al.locked_at DESC
  LIMIT 1;
  
  -- If no active lock found, return not locked
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TIMESTAMP, 0, NULL::VARCHAR(100);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to count recent failed attempts
CREATE OR REPLACE FUNCTION count_recent_failed_attempts(
  p_user_id UUID,
  p_minutes INTEGER DEFAULT 15
)
RETURNS INTEGER AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM failed_login_attempts
  WHERE user_id = p_user_id
    AND attempt_time > NOW() - (p_minutes || ' minutes')::INTERVAL;
  
  RETURN COALESCE(attempt_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to lock account
CREATE OR REPLACE FUNCTION lock_account(
  p_user_id UUID,
  p_reason VARCHAR(100),
  p_duration_minutes INTEGER DEFAULT 30
)
RETURNS UUID AS $$
DECLARE
  v_lock_id UUID;
  v_unlock_token VARCHAR(64);
BEGIN
  -- Generate unlock token
  v_unlock_token := encode(gen_random_bytes(32), 'hex');
  
  -- Create lock record
  INSERT INTO account_locks (
    user_id,
    locked_until,
    reason,
    unlock_token
  ) VALUES (
    p_user_id,
    NOW() + (p_duration_minutes || ' minutes')::INTERVAL,
    p_reason,
    v_unlock_token
  )
  RETURNING id INTO v_lock_id;
  
  RETURN v_lock_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to unlock account
CREATE OR REPLACE FUNCTION unlock_account(
  p_user_id UUID,
  p_unlocked_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE account_locks
  SET 
    unlocked_at = NOW(),
    unlocked_by = p_unlocked_by
  WHERE user_id = p_user_id
    AND locked_until > NOW()
    AND unlocked_at IS NULL;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  
  RETURN rows_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Create view for active locks
CREATE OR REPLACE VIEW active_account_locks AS
SELECT 
  al.*,
  u.full_name,
  u.phone,
  u.role,
  CEIL(EXTRACT(EPOCH FROM (al.locked_until - NOW())) / 60)::INTEGER as minutes_remaining
FROM account_locks al
JOIN users u ON al.user_id = u.id
WHERE al.locked_until > NOW()
  AND al.unlocked_at IS NULL
ORDER BY al.locked_at DESC;

-- Create view for failed attempt summary
CREATE OR REPLACE VIEW failed_attempts_summary AS
SELECT 
  u.id as user_id,
  u.full_name,
  u.phone,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE fla.attempt_time > NOW() - INTERVAL '15 minutes') as recent_attempts,
  MAX(fla.attempt_time) as last_attempt,
  COUNT(DISTINCT fla.ip_address) as unique_ips
FROM users u
LEFT JOIN failed_login_attempts fla ON u.id = fla.user_id
WHERE fla.attempt_time > NOW() - INTERVAL '24 hours'
GROUP BY u.id, u.full_name, u.phone
HAVING COUNT(*) >= 3
ORDER BY total_attempts DESC;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 006: Account lockout tables and functions created successfully';
END $$;

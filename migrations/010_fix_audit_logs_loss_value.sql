-- Fix: Add missing loss_value_naira column to audit_logs
ALTER TABLE audit_logs 
  ADD COLUMN IF NOT EXISTS loss_value_naira NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Recreate trigger function now that the column exists
CREATE OR REPLACE FUNCTION create_alert_if_critical() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'CRITICAL' THEN
        INSERT INTO alerts(shop_id, sku_id, audit_log_id, deviation, estimated_loss)
        VALUES (NEW.shop_id, NEW.sku_id, NEW.id, NEW.deviation, NEW.loss_value_naira);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

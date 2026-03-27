-- Fix the severity thresholds (anything < 1% should be OK, not WARNING)
CREATE OR REPLACE FUNCTION check_audit_severity() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expected_qty = 0 THEN
        NEW.deviation_percent := 100;
    ELSE
        NEW.deviation_percent := (NEW.deviation::numeric / NEW.expected_qty) * 100;
    END IF;

    IF ABS(NEW.deviation_percent) >= 10.00 THEN
        NEW.status := 'CRITICAL';
    ELSIF ABS(NEW.deviation_percent) >= 1.00 THEN
        NEW.status := 'WARNING';
    ELSE
        NEW.status := 'OK';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix the alert creation trigger: include all fields, fire for WARNING too
CREATE OR REPLACE FUNCTION create_alert_if_critical() RETURNS TRIGGER AS $$
DECLARE
    v_brand TEXT;
    v_size  TEXT;
    v_message TEXT;
BEGIN
    IF NEW.status IN ('WARNING', 'CRITICAL') THEN
        SELECT brand, size INTO v_brand, v_size FROM skus WHERE id = NEW.sku_id;

        IF NEW.deviation < 0 THEN
            v_message := 'Missing ' || ABS(NEW.deviation) || ' units of ' || v_brand || ' ' || v_size;
        ELSE
            v_message := 'Excess ' || NEW.deviation || ' units of ' || v_brand || ' ' || v_size;
        END IF;

        INSERT INTO alerts(shop_id, sku_id, audit_log_id, deviation, estimated_loss, type, severity, message)
        VALUES (NEW.shop_id, NEW.sku_id, NEW.id, NEW.deviation, NEW.loss_value_naira,
                'VARIANCE_DETECTED', NEW.status, v_message);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

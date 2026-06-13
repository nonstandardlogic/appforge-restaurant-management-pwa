-- One row per alert type (daily_ca, weekly_mb).
-- locale drives WhatsApp/email template selection (A1_FR/A1_EN etc.).
CREATE TABLE IF NOT EXISTS alerts_config (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type      TEXT          NOT NULL UNIQUE,
  threshold       NUMERIC(12,2),
  recipient_phone TEXT          NOT NULL,
  recipient_email TEXT          NOT NULL,
  locale          TEXT          NOT NULL DEFAULT 'fr',
  enabled         BOOLEAN       NOT NULL DEFAULT true,
  updated_at      TIMESTAMPTZ   DEFAULT now()
);

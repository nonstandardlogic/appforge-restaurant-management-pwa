-- Delivery history for every WhatsApp/email alert attempt.
-- payload stores the full request body; brevo_message_id tracks the Brevo receipt.
CREATE TABLE IF NOT EXISTS alerts_log (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type       TEXT        NOT NULL,
  template_id      TEXT        NOT NULL,
  channel          TEXT        NOT NULL CHECK (channel IN ('whatsapp', 'email')),
  status           TEXT        NOT NULL CHECK (status IN ('sent', 'failed', 'retrying')),
  attempt          INT         NOT NULL DEFAULT 1,
  payload          JSONB,
  brevo_message_id TEXT,
  error_message    TEXT,
  sent_at          TIMESTAMPTZ DEFAULT now()
);

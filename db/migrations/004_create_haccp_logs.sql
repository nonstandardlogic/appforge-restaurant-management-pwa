-- Daily HACCP temperature records per location for ISO 22000 traceability.
-- is_compliant is computed at write time: cold <= 4 C, hot >= 63 C.
CREATE TABLE IF NOT EXISTS haccp_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date      DATE        NOT NULL,
  location      TEXT        NOT NULL,
  temperature_c NUMERIC(5,2) NOT NULL,
  is_compliant  BOOLEAN     NOT NULL,
  notes         TEXT,
  recorded_by   UUID        REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

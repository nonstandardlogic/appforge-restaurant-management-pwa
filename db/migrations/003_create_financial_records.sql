-- Financial entries: revenue, expenses, P&L, margins, cash-flow.
-- period_month/period_year together identify the accounting period.
CREATE TABLE IF NOT EXISTS financial_records (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type         TEXT        NOT NULL,
  category     TEXT,
  amount       NUMERIC(12,2) NOT NULL,
  tva_rate     NUMERIC(5,2),
  period_month INT         NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year  INT         NOT NULL,
  notes        TEXT,
  created_by   UUID        REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT now()
);

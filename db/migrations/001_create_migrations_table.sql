-- Tracks which migrations have been applied.
-- Safe to run repeatedly: CREATE TABLE IF NOT EXISTS is idempotent.
CREATE TABLE IF NOT EXISTS migrations (
  id         SERIAL PRIMARY KEY,
  name       TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

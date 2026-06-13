-- Application users: gestionnaire (full access) and staff (operational only).
-- Passwords stored as bcrypt hashes (saltRounds=12), never in plaintext.
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL CHECK (role IN ('gestionnaire', 'staff')),
  locale        TEXT        NOT NULL DEFAULT 'fr' CHECK (locale IN ('fr', 'en')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

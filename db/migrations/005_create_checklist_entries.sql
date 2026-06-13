-- Daily opening checklist tasks. task_key maps to a next-intl translation key.
CREATE TABLE IF NOT EXISTS checklist_entries (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE        NOT NULL,
  task_key   TEXT        NOT NULL,
  is_done    BOOLEAN     NOT NULL DEFAULT false,
  done_at    TIMESTAMPTZ,
  done_by    UUID        REFERENCES users(id)
);

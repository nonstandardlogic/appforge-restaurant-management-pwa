-- Weekly availability grid per staff member.
-- week_start is always the Monday of the week (ISO 8601).
CREATE TABLE IF NOT EXISTS staff_hours (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id        UUID        NOT NULL REFERENCES users(id),
  week_start      DATE        NOT NULL,
  day_of_week     INT         NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  availability    TEXT        NOT NULL CHECK (availability IN ('DISPO', 'REPOS')),
  time_slot_start TIME,
  time_slot_end   TIME,
  validated       BOOLEAN     NOT NULL DEFAULT false,
  validated_by    UUID        REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

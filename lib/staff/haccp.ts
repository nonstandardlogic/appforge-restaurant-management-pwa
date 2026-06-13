import { getDb } from '@/lib/db/client';

export type HaccpLocation = 'cold_room' | 'prep_area' | 'dishwasher';

export interface HaccpLog {
  id: string;
  log_date: string;
  location: HaccpLocation;
  temperature_c: number;
  is_compliant: boolean;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
}

export interface HaccpInput {
  log_date: string;
  location: HaccpLocation;
  temperature_c: number;
  notes?: string;
  recorded_by?: string;
}

// cold_room and prep_area must be ≤ 4°C; dishwasher must be ≥ 63°C (HACCP FR)
export function computeCompliance(location: HaccpLocation, temp: number): boolean {
  if (location === 'dishwasher') return temp >= 63;
  return temp <= 4;
}

export async function fetchHaccpLogs(date?: string): Promise<HaccpLog[]> {
  const sql = getDb();
  const rows = date
    ? (await sql`
        SELECT id, log_date::text, location, temperature_c, is_compliant, notes, recorded_by, created_at
        FROM haccp_logs
        WHERE log_date = ${date}
        ORDER BY created_at DESC
      `) as Array<Record<string, any>>
    : (await sql`
        SELECT id, log_date::text, location, temperature_c, is_compliant, notes, recorded_by, created_at
        FROM haccp_logs
        ORDER BY log_date DESC, created_at DESC
        LIMIT 50
      `) as Array<Record<string, any>>;

  return rows.map((r) => ({
    id: r.id,
    log_date: r.log_date,
    location: r.location as HaccpLocation,
    temperature_c: parseFloat(r.temperature_c),
    is_compliant: r.is_compliant,
    notes: r.notes ?? null,
    recorded_by: r.recorded_by ?? null,
    created_at: r.created_at,
  }));
}

export async function submitHaccpReading(input: HaccpInput): Promise<HaccpLog> {
  const sql = getDb();
  const is_compliant = computeCompliance(input.location, input.temperature_c);

  const rows = (await sql`
    INSERT INTO haccp_logs (log_date, location, temperature_c, is_compliant, notes, recorded_by)
    VALUES (
      ${input.log_date},
      ${input.location},
      ${input.temperature_c},
      ${is_compliant},
      ${input.notes ?? null},
      ${input.recorded_by ?? null}
    )
    RETURNING id, log_date::text, location, temperature_c, is_compliant, notes, recorded_by, created_at
  `) as Array<Record<string, any>>;

  const r = rows[0];
  return {
    id: r.id,
    log_date: r.log_date,
    location: r.location as HaccpLocation,
    temperature_c: parseFloat(r.temperature_c),
    is_compliant: r.is_compliant,
    notes: r.notes ?? null,
    recorded_by: r.recorded_by ?? null,
    created_at: r.created_at,
  };
}

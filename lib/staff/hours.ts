import { getDb } from '@/lib/db/client';

export type Availability = 'DISPO' | 'REPOS';

export interface StaffHourEntry {
  id: string;
  staff_id: string;
  week_start: string;
  day_of_week: number;
  availability: Availability;
  time_slot_start: string | null;
  time_slot_end: string | null;
  validated: boolean;
}

export interface DayInput {
  day_of_week: number;
  availability: Availability;
  time_slot_start?: string;
  time_slot_end?: string;
}

export async function fetchWeekHours(staffId: string, weekStart: string): Promise<StaffHourEntry[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT id, staff_id, week_start::text, day_of_week, availability,
           time_slot_start::text, time_slot_end::text, validated
    FROM staff_hours
    WHERE staff_id = ${staffId} AND week_start = ${weekStart}
    ORDER BY day_of_week ASC
  `) as Array<Record<string, any>>;

  return rows.map((r) => ({
    id: r.id,
    staff_id: r.staff_id,
    week_start: r.week_start,
    day_of_week: r.day_of_week,
    availability: r.availability as Availability,
    time_slot_start: r.time_slot_start ?? null,
    time_slot_end: r.time_slot_end ?? null,
    validated: r.validated,
  }));
}

export async function submitWeekHours(
  staffId: string,
  weekStart: string,
  days: DayInput[]
): Promise<StaffHourEntry[]> {
  const sql = getDb();

  // Remove unvalidated entries so the staff member can revise their submission
  await sql`
    DELETE FROM staff_hours
    WHERE staff_id = ${staffId} AND week_start = ${weekStart} AND validated = false
  `;

  for (const day of days) {
    await sql`
      INSERT INTO staff_hours (staff_id, week_start, day_of_week, availability, time_slot_start, time_slot_end)
      VALUES (
        ${staffId},
        ${weekStart},
        ${day.day_of_week},
        ${day.availability},
        ${day.time_slot_start ?? null},
        ${day.time_slot_end ?? null}
      )
    `;
  }

  return fetchWeekHours(staffId, weekStart);
}

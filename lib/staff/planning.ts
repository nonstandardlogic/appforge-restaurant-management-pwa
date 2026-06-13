import { getDb } from '@/lib/db/client';
import type { StaffHourEntry, Availability } from './hours';

export interface PlanningMember {
  staff_id: string;
  email: string;
  days: StaffHourEntry[];
}

export interface PlanningGrid {
  weekStart: string;
  staff: PlanningMember[];
}

export async function fetchPlanningGrid(weekStart: string): Promise<PlanningGrid> {
  const sql = getDb();

  const rows = (await sql`
    SELECT sh.id, sh.staff_id, sh.week_start::text, sh.day_of_week,
           sh.availability, sh.time_slot_start::text, sh.time_slot_end::text,
           sh.validated, u.email
    FROM staff_hours sh
    JOIN users u ON u.id = sh.staff_id
    WHERE sh.week_start = ${weekStart}
    ORDER BY u.email ASC, sh.day_of_week ASC
  `) as Array<Record<string, any>>;

  const byStaff = new Map<string, { email: string; days: StaffHourEntry[] }>();
  for (const r of rows) {
    if (!byStaff.has(r.staff_id)) {
      byStaff.set(r.staff_id, { email: r.email, days: [] });
    }
    byStaff.get(r.staff_id)!.days.push({
      id: r.id,
      staff_id: r.staff_id,
      week_start: r.week_start,
      day_of_week: r.day_of_week,
      availability: r.availability as Availability,
      time_slot_start: r.time_slot_start ?? null,
      time_slot_end: r.time_slot_end ?? null,
      validated: r.validated,
    });
  }

  return {
    weekStart,
    staff: Array.from(byStaff.entries()).map(([staff_id, data]) => ({
      staff_id,
      ...data,
    })),
  };
}

export async function validateSchedule(
  staffId: string,
  weekStart: string,
  validatedBy: string
): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE staff_hours
    SET validated = true, validated_by = ${validatedBy}
    WHERE staff_id = ${staffId} AND week_start = ${weekStart}
  `;
}

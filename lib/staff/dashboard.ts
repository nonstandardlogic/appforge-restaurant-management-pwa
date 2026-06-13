import { getDb } from '@/lib/db/client';

export interface StaffDashboard {
  checklistProgress: { done: number; total: number };
  nextHaccpCheck: { location: string; lastChecked: string | null } | null;
  nonCompliantToday: number;
  allClear: boolean;
}

const ALL_HACCP_LOCATIONS = ['cold_room', 'prep_area', 'dishwasher'] as const;

export async function fetchStaffDashboard(_userId: string): Promise<StaffDashboard> {
  const sql = getDb();
  const today = new Date().toISOString().split('T')[0];

  const [checklistRows, haccpRows, nonCompliantRows] = (await Promise.all([
    sql`
      SELECT COUNT(*) AS total,
             SUM(CASE WHEN is_done THEN 1 ELSE 0 END) AS done
      FROM checklist_entries
      WHERE entry_date = ${today}
    `,
    sql`
      SELECT location, MAX(log_date::text) AS last_checked
      FROM haccp_logs
      WHERE log_date = ${today}
      GROUP BY location
    `,
    sql`
      SELECT COUNT(*) AS count
      FROM haccp_logs
      WHERE log_date = ${today} AND is_compliant = false
    `,
  ])) as [Array<Record<string, any>>, Array<Record<string, any>>, Array<Record<string, any>>];

  const total = parseInt(checklistRows[0]?.total ?? '0', 10);
  const done = parseInt(checklistRows[0]?.done ?? '0', 10);
  const nonCompliant = parseInt(nonCompliantRows[0]?.count ?? '0', 10);

  const checkedLocations = new Set(haccpRows.map((r) => r.location));
  const unchecked = ALL_HACCP_LOCATIONS.find((loc) => !checkedLocations.has(loc));

  const nextHaccpCheck = unchecked
    ? { location: unchecked, lastChecked: null }
    : haccpRows.length > 0
    ? { location: haccpRows[0].location, lastChecked: haccpRows[0].last_checked }
    : null;

  const allClear =
    done === total && total > 0 && haccpRows.length >= ALL_HACCP_LOCATIONS.length && nonCompliant === 0;

  return {
    checklistProgress: { done, total },
    nextHaccpCheck,
    nonCompliantToday: nonCompliant,
    allClear,
  };
}

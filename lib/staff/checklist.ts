import { getDb } from '@/lib/db/client';

export const DEFAULT_TASK_KEYS = [
  'checklist.open_doors',
  'checklist.check_temperatures',
  'checklist.prepare_sauces',
  'checklist.setup_tables',
  'checklist.check_stock',
  'checklist.clean_kitchen',
  'checklist.check_hygiene',
] as const;

export type TaskKey = (typeof DEFAULT_TASK_KEYS)[number];

export interface ChecklistEntry {
  id: string;
  entry_date: string;
  task_key: string;
  is_done: boolean;
  done_at: string | null;
  done_by: string | null;
}

export async function fetchTodayChecklist(date?: string): Promise<ChecklistEntry[]> {
  const sql = getDb();
  const targetDate = date ?? new Date().toISOString().split('T')[0];

  const existing = (await sql`
    SELECT COUNT(*) AS count FROM checklist_entries WHERE entry_date = ${targetDate}
  `) as Array<Record<string, any>>;

  if (parseInt(existing[0]?.count ?? '0', 10) === 0) {
    for (const task_key of DEFAULT_TASK_KEYS) {
      await sql`
        INSERT INTO checklist_entries (entry_date, task_key)
        VALUES (${targetDate}, ${task_key})
      `;
    }
  }

  const rows = (await sql`
    SELECT id, entry_date::text, task_key, is_done, done_at, done_by
    FROM checklist_entries
    WHERE entry_date = ${targetDate}
    ORDER BY task_key ASC
  `) as Array<Record<string, any>>;

  return rows.map((r) => ({
    id: r.id,
    entry_date: r.entry_date,
    task_key: r.task_key,
    is_done: r.is_done,
    done_at: r.done_at ?? null,
    done_by: r.done_by ?? null,
  }));
}

export async function markChecklistItem(entryId: string, userId: string): Promise<ChecklistEntry> {
  const sql = getDb();
  const rows = (await sql`
    UPDATE checklist_entries
    SET is_done = true, done_at = now(), done_by = ${userId}
    WHERE id = ${entryId}
    RETURNING id, entry_date::text, task_key, is_done, done_at, done_by
  `) as Array<Record<string, any>>;

  const r = rows[0];
  return {
    id: r.id,
    entry_date: r.entry_date,
    task_key: r.task_key,
    is_done: r.is_done,
    done_at: r.done_at ?? null,
    done_by: r.done_by ?? null,
  };
}

import * as fs from 'fs';
import * as path from 'path';

export interface DbClient {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
}

export async function getAppliedMigrations(db: DbClient): Promise<string[]> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  const result = await db.query('SELECT name FROM migrations ORDER BY name ASC');
  return (result.rows as { name: string }[]).map((r) => r.name);
}

export function getMigrationFiles(migrationsDir: string): string[] {
  if (!fs.existsSync(migrationsDir)) return [];
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

export async function runMigrations(
  db: DbClient,
  migrationsDir: string
): Promise<string[]> {
  const applied = await getAppliedMigrations(db);
  const files = getMigrationFiles(migrationsDir);
  const pending = files.filter((f) => !applied.includes(f));
  const ran: string[] = [];

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    await db.query(sql);
    await db.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
    ran.push(file);
  }

  return ran;
}

import { neon } from '@neondatabase/serverless';
import * as path from 'path';
import { runMigrations, DbClient } from '../lib/db/migrator';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is required.\n' +
      'Set it in .env.local or export it before running this script.'
    );
  }

  const sql = neon(databaseUrl);

  const db: DbClient = {
    query: async (text: string, params?: unknown[]) => {
      const rows = await sql(text, params as never[]);
      return { rows: Array.isArray(rows) ? rows : [] };
    },
  };

  const migrationsDir = path.resolve(process.cwd(), 'db', 'migrations');
  const ran = await runMigrations(db, migrationsDir);

  if (ran.length === 0) {
    console.log('No new migrations to apply — database is up to date.');
  } else {
    console.log(`Applied ${ran.length} migration(s):`);
    ran.forEach((name) => console.log(`  - ${name}`));
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});

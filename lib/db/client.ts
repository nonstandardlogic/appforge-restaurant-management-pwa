import { neon } from '@neondatabase/serverless';

// Lazy singleton — initialised on first call, not at import time.
// DATABASE_URL must point to a Neon PostgreSQL endpoint in the EU Central
// region (provisioned via the Vercel Marketplace) to satisfy GDPR data
// residency requirements.
let _sql: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL environment variable is required');
    _sql = neon(url);
  }
  return _sql;
}

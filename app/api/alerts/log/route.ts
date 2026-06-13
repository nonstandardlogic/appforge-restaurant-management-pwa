import { NextResponse } from 'next/server';
import { requireGestionnaire } from '@/lib/auth/guard';
import { getDb } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authError = await requireGestionnaire();
  if (authError) return authError;

  const sql = getDb();
  const rows = (await sql`
    SELECT * FROM alerts_log
    ORDER BY sent_at DESC
    LIMIT 100
  `) as unknown as Array<Record<string, unknown>>;

  return NextResponse.json(rows);
}

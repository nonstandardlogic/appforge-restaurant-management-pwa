import { NextRequest, NextResponse } from 'next/server';
import { evaluateWeeklyMB } from '@/lib/alerts/weekly-mb';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await evaluateWeeklyMB();
  return NextResponse.json(result);
}

import { requireGestionnaire } from '@/lib/auth/guard';
import { NextResponse } from 'next/server';
import { fetchMonthlyPL } from '@/lib/financial/pl';

export async function GET(request: Request) {
  const denied = await requireGestionnaire();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const month = Number(searchParams.get('month') ?? now.getMonth() + 1);
  const year = Number(searchParams.get('year') ?? now.getFullYear());

  if (month < 1 || month > 12 || year < 2000 || year > 2100) {
    return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
  }

  try {
    const pl = await fetchMonthlyPL(month, year);
    return NextResponse.json(pl);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

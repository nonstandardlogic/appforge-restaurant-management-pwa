import { requireGestionnaire } from '@/lib/auth/guard';
import { NextResponse } from 'next/server';
import { fetchKpisForMonth } from '@/lib/financial/kpis';

export async function GET() {
  const denied = await requireGestionnaire();
  if (denied) return denied;

  const now = new Date();
  try {
    const kpis = await fetchKpisForMonth(now.getMonth() + 1, now.getFullYear());
    return NextResponse.json(kpis);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

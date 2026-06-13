import { requireGestionnaire } from '@/lib/auth/guard';
import { NextResponse } from 'next/server';
import { fetchWeeklyCashFlow, fetchMonthlyCashFlow } from '@/lib/financial/cashflow';

export async function GET(request: Request) {
  const denied = await requireGestionnaire();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') ?? 'monthly';
  const now = new Date();

  try {
    if (view === 'weekly') {
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      monday.setHours(0, 0, 0, 0);
      const data = await fetchWeeklyCashFlow(monday);
      return NextResponse.json(data);
    }

    const month = Number(searchParams.get('month') ?? now.getMonth() + 1);
    const year = Number(searchParams.get('year') ?? now.getFullYear());
    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
    }
    const data = await fetchMonthlyCashFlow(month, year);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

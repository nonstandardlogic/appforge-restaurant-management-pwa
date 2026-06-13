import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { fetchWeekHours, submitWeekHours } from '@/lib/staff/hours';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await requireAuth();
  if (guard) return guard;

  const { searchParams } = new URL(request.url);
  const staff_id = searchParams.get('staff_id');
  const week_start = searchParams.get('week_start');

  if (!staff_id || !week_start) {
    return NextResponse.json(
      { error: 'Missing required params: staff_id, week_start' },
      { status: 400 }
    );
  }

  const hours = await fetchWeekHours(staff_id, week_start);
  return NextResponse.json(hours);
}

export async function POST(request: NextRequest) {
  const guard = await requireAuth();
  if (guard) return guard;

  const body = await request.json();
  const { staff_id, week_start, days } = body;

  if (!staff_id || !week_start || !Array.isArray(days)) {
    return NextResponse.json(
      { error: 'Missing required fields: staff_id, week_start, days' },
      { status: 400 }
    );
  }

  const hours = await submitWeekHours(staff_id, week_start, days);
  return NextResponse.json(hours, { status: 201 });
}

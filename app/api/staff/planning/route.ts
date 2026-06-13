import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireGestionnaire } from '@/lib/auth/guard';
import { fetchPlanningGrid, validateSchedule } from '@/lib/staff/planning';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await requireAuth();
  if (guard) return guard;

  const { searchParams } = new URL(request.url);
  const week_start = searchParams.get('week_start');

  if (!week_start) {
    return NextResponse.json({ error: 'Missing required param: week_start' }, { status: 400 });
  }

  const grid = await fetchPlanningGrid(week_start);
  return NextResponse.json(grid);
}

export async function PATCH(request: NextRequest) {
  const guard = await requireGestionnaire();
  if (guard) return guard;

  const body = await request.json();
  const { staff_id, week_start, validated_by } = body;

  if (!staff_id || !week_start || !validated_by) {
    return NextResponse.json(
      { error: 'Missing required fields: staff_id, week_start, validated_by' },
      { status: 400 }
    );
  }

  await validateSchedule(staff_id, week_start, validated_by);
  return NextResponse.json({ success: true });
}

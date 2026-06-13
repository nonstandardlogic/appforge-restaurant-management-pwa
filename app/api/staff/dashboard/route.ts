import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { fetchStaffDashboard } from '@/lib/staff/dashboard';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await requireAuth();
  if (guard) return guard;

  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');

  if (!user_id) {
    return NextResponse.json({ error: 'Missing required param: user_id' }, { status: 400 });
  }

  const dashboard = await fetchStaffDashboard(user_id);
  return NextResponse.json(dashboard);
}

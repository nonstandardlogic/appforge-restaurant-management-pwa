import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { fetchTodayChecklist, markChecklistItem } from '@/lib/staff/checklist';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await requireAuth();
  if (guard) return guard;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') ?? undefined;

  const entries = await fetchTodayChecklist(date);
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const guard = await requireAuth();
  if (guard) return guard;

  const body = await request.json();
  const { entry_id, user_id } = body;

  if (!entry_id || !user_id) {
    return NextResponse.json(
      { error: 'Missing required fields: entry_id, user_id' },
      { status: 400 }
    );
  }

  const entry = await markChecklistItem(entry_id, user_id);
  return NextResponse.json(entry);
}

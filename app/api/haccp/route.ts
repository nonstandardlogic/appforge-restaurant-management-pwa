import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { fetchHaccpLogs, submitHaccpReading } from '@/lib/staff/haccp';
import type { HaccpLocation } from '@/lib/staff/haccp';

export const dynamic = 'force-dynamic';

const VALID_LOCATIONS: HaccpLocation[] = ['cold_room', 'prep_area', 'dishwasher'];

export async function GET(request: NextRequest) {
  const guard = await requireAuth();
  if (guard) return guard;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') ?? undefined;

  const logs = await fetchHaccpLogs(date);
  return NextResponse.json(logs);
}

export async function POST(request: NextRequest) {
  const guard = await requireAuth();
  if (guard) return guard;

  const body = await request.json();
  const { log_date, location, temperature_c, notes, recorded_by } = body;

  if (!log_date || !location || temperature_c === undefined) {
    return NextResponse.json(
      { error: 'Missing required fields: log_date, location, temperature_c' },
      { status: 400 }
    );
  }

  if (!VALID_LOCATIONS.includes(location)) {
    return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
  }

  const tempNum = parseFloat(temperature_c);
  if (isNaN(tempNum)) {
    return NextResponse.json({ error: 'temperature_c must be a number' }, { status: 400 });
  }

  const log = await submitHaccpReading({
    log_date,
    location: location as HaccpLocation,
    temperature_c: tempNum,
    notes,
    recorded_by,
  });
  return NextResponse.json(log, { status: 201 });
}

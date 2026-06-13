import { requireGestionnaire } from '@/lib/auth/guard';
import { NextResponse } from 'next/server';
import { computeBreakEven } from '@/lib/financial/break-even';

export async function POST(request: Request) {
  const denied = await requireGestionnaire();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { chargesFixees, chargesVariables, caHT, proportionFood } = body;
  if (
    typeof chargesFixees !== 'number' ||
    typeof chargesVariables !== 'number' ||
    typeof caHT !== 'number' ||
    typeof proportionFood !== 'number' ||
    proportionFood < 0 || proportionFood > 1
  ) {
    return NextResponse.json(
      { error: 'chargesFixees, chargesVariables, caHT (numbers) and proportionFood (0–1) required' },
      { status: 400 },
    );
  }

  const result = computeBreakEven({ chargesFixees, chargesVariables, caHT, proportionFood });
  return NextResponse.json(result);
}

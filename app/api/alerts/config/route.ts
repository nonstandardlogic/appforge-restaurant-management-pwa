import { NextRequest, NextResponse } from 'next/server';
import { requireGestionnaire } from '@/lib/auth/guard';
import { getAllAlertConfigs, updateAlertConfig } from '@/lib/alerts/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authError = await requireGestionnaire();
  if (authError) return authError;

  const configs = await getAllAlertConfigs();
  return NextResponse.json(configs);
}

export async function PATCH(req: NextRequest) {
  const authError = await requireGestionnaire();
  if (authError) return authError;

  const body = await req.json() as Record<string, unknown>;
  const { alert_type, ...updates } = body;
  if (!alert_type || typeof alert_type !== 'string') {
    return NextResponse.json({ error: 'alert_type required' }, { status: 400 });
  }

  const updated = await updateAlertConfig(alert_type, updates as Parameters<typeof updateAlertConfig>[1]);
  return NextResponse.json(updated);
}

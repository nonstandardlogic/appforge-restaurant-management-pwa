import { requireGestionnaire } from '@/lib/auth/guard';
import { NextResponse } from 'next/server';

export async function GET() {
  const denied = await requireGestionnaire();
  if (denied) return denied;

  // Full KPI query implemented in NSLRMP-13
  return NextResponse.json({ message: 'KPIs endpoint ready' });
}

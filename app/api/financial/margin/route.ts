import { requireGestionnaire } from '@/lib/auth/guard';
import { NextResponse } from 'next/server';
import { computeGrossMargins } from '@/lib/financial/margin';
import type { CategoryInput } from '@/lib/financial/margin';

export async function POST(request: Request) {
  const denied = await requireGestionnaire();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const categories = body.categories;
  if (!Array.isArray(categories) || categories.length === 0) {
    return NextResponse.json({ error: 'categories array is required' }, { status: 400 });
  }

  const report = computeGrossMargins(categories as CategoryInput[]);
  return NextResponse.json(report);
}

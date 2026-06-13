import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * Checks that a valid session exists and that the user holds the required role.
 * Returns a NextResponse (401 or 403) to return early from a route handler,
 * or null to signal the request may proceed.
 *
 * Defense-in-depth layer 2: works alongside the Edge middleware that blocks
 * /finances/* and /api/financial/* before the request reaches this handler.
 */
export async function requireRole(role: string): Promise<NextResponse | null> {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== role) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}

export async function requireGestionnaire(): Promise<NextResponse | null> {
  return requireRole('gestionnaire');
}

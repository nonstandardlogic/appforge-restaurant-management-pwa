import { requireGestionnaire } from '@/lib/auth/guard';
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const denied = await requireGestionnaire();
  if (denied) return denied;

  const body = await request.json() as { role?: string };
  const { role } = body;

  if (!role || !['gestionnaire', 'staff'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    UPDATE users SET role = ${role}
    WHERE id = ${params.id}
    RETURNING id, email, role, locale
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user: rows[0] });
}

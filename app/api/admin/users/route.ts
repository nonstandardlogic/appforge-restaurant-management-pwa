import { requireGestionnaire } from '@/lib/auth/guard';
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET() {
  const denied = await requireGestionnaire();
  if (denied) return denied;

  const sql = neon(process.env.DATABASE_URL!);
  const users = await sql`
    SELECT id, email, role, locale, created_at
    FROM users
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const denied = await requireGestionnaire();
  if (denied) return denied;

  const body = await request.json() as { email?: string; role?: string; locale?: string };
  const { email, role, locale = 'fr' } = body;

  if (!email || !role) {
    return NextResponse.json({ error: 'email and role are required' }, { status: 400 });
  }
  if (!['gestionnaire', 'staff'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const tempPassword = Math.random().toString(36).slice(-12);
  const password_hash = await bcrypt.hash(tempPassword, 12);

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    INSERT INTO users (email, password_hash, role, locale)
    VALUES (${email}, ${password_hash}, ${role}, ${locale})
    RETURNING id, email, role, locale, created_at
  `;

  return NextResponse.json({ user: rows[0] }, { status: 201 });
}

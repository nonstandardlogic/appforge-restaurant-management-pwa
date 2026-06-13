import { requireGestionnaire } from '@/lib/auth/guard';
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import { generateResetToken } from '@/lib/auth/tokens';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const denied = await requireGestionnaire();
  if (denied) return denied;

  const { token, expiresAt } = generateResetToken();
  const lockHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    UPDATE users
    SET password_hash     = ${lockHash},
        reset_token       = ${token},
        reset_expires_at  = ${expiresAt.toISOString()}
    WHERE id = ${params.id}
    RETURNING id, email
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    message: 'Password reset initiated. Reset link valid for 24 hours.',
    userId: rows[0].id,
    email: rows[0].email,
  });
}

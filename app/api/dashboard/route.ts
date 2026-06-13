import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = session.user;

  if (role === 'gestionnaire') {
    return NextResponse.json({
      userId,
      role,
      financial: {
        ca: null,
        tresorerie: null,
        margebrute: null,
      },
      operational: { planning: [] },
    });
  }

  return NextResponse.json({
    userId,
    role,
    operational: { planning: [] },
  });
}

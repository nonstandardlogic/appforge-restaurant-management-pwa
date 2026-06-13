import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { VALID_LOCALES, persistLocale, type Locale } from '@/lib/i18n/locale';

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const candidate = (body as Record<string, unknown>).locale;
  if (!VALID_LOCALES.includes(candidate as Locale)) {
    return NextResponse.json({ error: 'Invalid locale — must be fr or en' }, { status: 400 });
  }
  const locale = candidate as Locale;

  await persistLocale(session.user.id, locale);

  const response = NextResponse.json({ locale });
  response.cookies.set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    httpOnly: false,
  });
  return response;
}

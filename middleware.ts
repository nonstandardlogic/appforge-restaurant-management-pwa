import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { NextResponse } from 'next/server';
import { resolveRoute } from '@/lib/rbac/rules';

const { auth } = NextAuth(authConfig);

export default auth(function middleware(req) {
  const { pathname } = req.nextUrl;
  const decision = resolveRoute(pathname, req.auth?.user?.role, !!req.auth);

  if (decision.type === 'redirect') {
    return NextResponse.redirect(new URL(decision.destination!, req.url));
  }
  if (decision.type === 'forbidden') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/finances/:path*',
    '/admin/:path*',
    '/api/financial/:path*',
    '/api/admin/:path*',
    '/api/dashboard/:path*',
  ],
};

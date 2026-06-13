export interface RouteDecision {
  type: 'redirect' | 'forbidden' | 'allow';
  destination?: string;
}

export function resolveRoute(
  pathname: string,
  role: string | undefined,
  isLoggedIn: boolean,
): RouteDecision {
  if (!isLoggedIn) {
    return {
      type: 'redirect',
      destination: `/login?callbackUrl=${encodeURIComponent(pathname)}`,
    };
  }

  if (role === 'staff') {
    if (pathname.startsWith('/finances') || pathname.startsWith('/admin')) {
      return { type: 'redirect', destination: '/dashboard' };
    }
    if (
      pathname.startsWith('/api/financial') ||
      pathname.startsWith('/api/admin')
    ) {
      return { type: 'forbidden' };
    }
  }

  return { type: 'allow' };
}

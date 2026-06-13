import { resolveRoute } from '@/lib/rbac/rules';

describe('NSLRMP-9 — RBAC middleware routing rules', () => {
  describe('unauthenticated users', () => {
    it('redirects to /login with callbackUrl for protected routes', () => {
      const result = resolveRoute('/dashboard', undefined, false);
      expect(result.type).toBe('redirect');
      expect(result.destination).toContain('/login');
      expect(result.destination).toContain('callbackUrl');
    });

    it('encodes the callbackUrl in the redirect destination', () => {
      const result = resolveRoute('/finances/kpis', undefined, false);
      expect(result.type).toBe('redirect');
      expect(result.destination).toContain(encodeURIComponent('/finances/kpis'));
    });

    it('redirects unauthenticated users away from /admin/*', () => {
      const result = resolveRoute('/admin/users', undefined, false);
      expect(result.type).toBe('redirect');
      expect(result.destination).toContain('/login');
    });
  });

  describe('staff role', () => {
    it('redirects staff from /finances/* to /dashboard', () => {
      const result = resolveRoute('/finances/report', 'staff', true);
      expect(result.type).toBe('redirect');
      expect(result.destination).toBe('/dashboard');
    });

    it('redirects staff from /admin/* to /dashboard', () => {
      const result = resolveRoute('/admin/permissions', 'staff', true);
      expect(result.type).toBe('redirect');
      expect(result.destination).toBe('/dashboard');
    });

    it('returns forbidden for staff on /api/financial/*', () => {
      const result = resolveRoute('/api/financial/kpis', 'staff', true);
      expect(result.type).toBe('forbidden');
      expect(result.destination).toBeUndefined();
    });

    it('returns forbidden for staff on /api/admin/*', () => {
      const result = resolveRoute('/api/admin/users', 'staff', true);
      expect(result.type).toBe('forbidden');
    });

    it('allows staff on /dashboard', () => {
      const result = resolveRoute('/dashboard', 'staff', true);
      expect(result.type).toBe('allow');
    });

    it('allows staff on /api/dashboard', () => {
      const result = resolveRoute('/api/dashboard', 'staff', true);
      expect(result.type).toBe('allow');
    });
  });

  describe('gestionnaire role', () => {
    it('allows gestionnaire on /finances/*', () => {
      const result = resolveRoute('/finances/kpis', 'gestionnaire', true);
      expect(result.type).toBe('allow');
    });

    it('allows gestionnaire on /admin/*', () => {
      const result = resolveRoute('/admin/users', 'gestionnaire', true);
      expect(result.type).toBe('allow');
    });

    it('allows gestionnaire on /api/financial/*', () => {
      const result = resolveRoute('/api/financial/kpis', 'gestionnaire', true);
      expect(result.type).toBe('allow');
    });

    it('allows gestionnaire on /api/admin/*', () => {
      const result = resolveRoute('/api/admin/users', 'gestionnaire', true);
      expect(result.type).toBe('allow');
    });

    it('allows gestionnaire on /dashboard', () => {
      const result = resolveRoute('/dashboard', 'gestionnaire', true);
      expect(result.type).toBe('allow');
    });
  });
});

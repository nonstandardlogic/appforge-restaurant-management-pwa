/**
 * NSLRMP-24 — Role-based authorization guard unit tests.
 *
 * lib/auth is mocked so these tests run without a database or real JWT.
 * The mock is hoisted by Jest before any import, ensuring guard.ts receives
 * the fake `auth` function when it imports from '@/lib/auth'.
 */
jest.mock('../../lib/auth', () => ({
  auth: jest.fn(),
}));

import { auth } from '../../lib/auth';
import { requireGestionnaire, requireRole } from '../../lib/auth/guard';

const mockAuth = auth as jest.Mock;

describe('NSLRMP-24 — Role-based authorization guard', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('requireGestionnaire — /api/financial/* protection', () => {
    it('returns 401 when no session exists (missing or expired JWT)', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const response = await requireGestionnaire();

      expect(response).not.toBeNull();
      expect(response!.status).toBe(401);
      const body = await response!.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 403 for a staff JWT — request body is never processed', async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: 'u-staff', email: 'staff@restaurant.fr', role: 'staff' },
      });

      const response = await requireGestionnaire();

      expect(response).not.toBeNull();
      expect(response!.status).toBe(403);
      const body = await response!.json();
      expect(body.error).toBe('Forbidden');
    });

    it('returns null for a gestionnaire JWT — request proceeds to handler', async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: 'u-mgr', email: 'chef@restaurant.fr', role: 'gestionnaire' },
      });

      const response = await requireGestionnaire();

      expect(response).toBeNull();
    });
  });

  describe('requireRole', () => {
    it('returns 401 when session is null regardless of required role', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const response = await requireRole('gestionnaire');

      expect(response!.status).toBe(401);
    });

    it('returns 403 when the user role does not match the required role', async () => {
      mockAuth.mockResolvedValueOnce({
        user: { role: 'staff' },
      });

      const response = await requireRole('gestionnaire');

      expect(response!.status).toBe(403);
    });

    it('returns null when the user role exactly matches the required role', async () => {
      mockAuth.mockResolvedValueOnce({
        user: { role: 'gestionnaire' },
      });

      const response = await requireRole('gestionnaire');

      expect(response).toBeNull();
    });
  });
});

jest.mock('@/lib/auth/guard', () => ({
  requireGestionnaire: jest.fn(),
}));
jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(),
}));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$fakehash'),
  compare: jest.fn().mockResolvedValue(true),
}));
jest.mock('@/lib/auth/tokens', () => ({
  generateResetToken: jest.fn(),
  isTokenExpired: jest.fn(() => false),
}));

import { requireGestionnaire } from '@/lib/auth/guard';
import { neon } from '@neondatabase/serverless';
import { generateResetToken } from '@/lib/auth/tokens';
import { GET, POST } from '@/app/api/admin/users/route';
import { PUT } from '@/app/api/admin/users/[id]/route';
import { POST as RESET_POST } from '@/app/api/admin/users/[id]/reset-password/route';

const mockRequireGestionnaire = requireGestionnaire as jest.Mock;
const mockNeon = neon as jest.Mock;
const mockGenerateResetToken = generateResetToken as jest.Mock;

// Re-apply generateResetToken implementation after each jest.resetAllMocks() call
beforeEach(() => {
  mockGenerateResetToken.mockReturnValue({
    token: 'test-reset-token-abc123',
    expiresAt: new Date('2026-06-14T00:00:00Z'),
  });
});

describe('NSLRMP-11 — User account management API (S9)', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/admin/users', () => {
    it('returns 403 when session role is not gestionnaire', async () => {
      const { NextResponse } = await import('next/server');
      mockRequireGestionnaire.mockResolvedValueOnce(
        NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      );

      const res = await GET();

      expect(res.status).toBe(403);
    });

    it('returns full user list for gestionnaire', async () => {
      mockRequireGestionnaire.mockResolvedValueOnce(null);
      const mockSql = jest.fn().mockResolvedValueOnce([
        { id: 'u1', email: 'alice@restaurant.fr', role: 'gestionnaire', locale: 'fr' },
        { id: 'u2', email: 'bob@restaurant.fr', role: 'staff', locale: 'fr' },
      ]);
      mockNeon.mockReturnValueOnce(mockSql);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.users).toHaveLength(2);
    });
  });

  describe('POST /api/admin/users — create user', () => {
    it('returns 400 when email is missing', async () => {
      mockRequireGestionnaire.mockResolvedValueOnce(null);

      const req = new Request('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ role: 'staff' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid role value', async () => {
      mockRequireGestionnaire.mockResolvedValueOnce(null);

      const req = new Request('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ email: 'new@restaurant.fr', role: 'superadmin' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('creates a staff user and returns 201 with user data', async () => {
      mockRequireGestionnaire.mockResolvedValueOnce(null);
      const mockSql = jest.fn().mockResolvedValueOnce([
        { id: 'u3', email: 'new@restaurant.fr', role: 'staff', locale: 'fr', created_at: '2026-06-13' },
      ]);
      mockNeon.mockReturnValueOnce(mockSql);

      const req = new Request('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ email: 'new@restaurant.fr', role: 'staff' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.user.email).toBe('new@restaurant.fr');
      expect(body.user.role).toBe('staff');
    });
  });

  describe('PUT /api/admin/users/[id] — role assignment', () => {
    it('returns 400 for invalid role', async () => {
      mockRequireGestionnaire.mockResolvedValueOnce(null);

      const req = new Request('http://localhost/api/admin/users/u1', {
        method: 'PUT',
        body: JSON.stringify({ role: 'admin' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PUT(req, { params: { id: 'u1' } });
      expect(res.status).toBe(400);
    });

    it('assigns gestionnaire role and returns updated user', async () => {
      mockRequireGestionnaire.mockResolvedValueOnce(null);
      const mockSql = jest.fn().mockResolvedValueOnce([
        { id: 'u2', email: 'bob@restaurant.fr', role: 'gestionnaire', locale: 'fr' },
      ]);
      mockNeon.mockReturnValueOnce(mockSql);

      const req = new Request('http://localhost/api/admin/users/u2', {
        method: 'PUT',
        body: JSON.stringify({ role: 'gestionnaire' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PUT(req, { params: { id: 'u2' } });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.user.role).toBe('gestionnaire');
    });

    it('returns 404 when user does not exist', async () => {
      mockRequireGestionnaire.mockResolvedValueOnce(null);
      const mockSql = jest.fn().mockResolvedValueOnce([]);
      mockNeon.mockReturnValueOnce(mockSql);

      const req = new Request('http://localhost/api/admin/users/nonexistent', {
        method: 'PUT',
        body: JSON.stringify({ role: 'staff' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PUT(req, { params: { id: 'nonexistent' } });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/admin/users/[id]/reset-password', () => {
    it('returns 404 when user does not exist', async () => {
      mockRequireGestionnaire.mockResolvedValueOnce(null);
      const mockSql = jest.fn().mockResolvedValueOnce([]);
      mockNeon.mockReturnValueOnce(mockSql);

      const req = new Request('http://localhost/api/admin/users/ghost/reset-password', {
        method: 'POST',
      });

      const res = await RESET_POST(req, { params: { id: 'ghost' } });
      expect(res.status).toBe(404);
    });

    it('invalidates old password and initiates reset with 24h token', async () => {
      mockRequireGestionnaire.mockResolvedValueOnce(null);
      const mockSql = jest.fn().mockResolvedValueOnce([
        { id: 'u1', email: 'alice@restaurant.fr' },
      ]);
      mockNeon.mockReturnValueOnce(mockSql);

      const req = new Request('http://localhost/api/admin/users/u1/reset-password', {
        method: 'POST',
      });

      const res = await RESET_POST(req, { params: { id: 'u1' } });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.message).toContain('24 hours');
      expect(body.email).toBe('alice@restaurant.fr');
      expect(body.userId).toBe('u1');
    });
  });
});

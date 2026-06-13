jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));

import { auth } from '@/lib/auth';
import { GET } from '@/app/api/dashboard/route';

const mockAuth = auth as jest.Mock;

describe('NSLRMP-10 — Staff restricted dashboard API', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns 401 when no session exists (missing or expired JWT)', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const res = await GET();

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('omits financial fields from staff response payload', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'u-staff', email: 'staff@restaurant.fr', role: 'staff' },
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.role).toBe('staff');
    expect(body.financial).toBeUndefined();
    expect('ca' in body).toBe(false);
    expect('tresorerie' in body).toBe(false);
    expect('margebrute' in body).toBe(false);
  });

  it('includes financial KPI fields for gestionnaire', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'u-mgr', email: 'chef@restaurant.fr', role: 'gestionnaire' },
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.financial).toBeDefined();
    expect(body.financial).toHaveProperty('ca');
    expect(body.financial).toHaveProperty('tresorerie');
    expect(body.financial).toHaveProperty('margebrute');
  });

  it('includes operational data in both staff and gestionnaire responses', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u-s', role: 'staff' } });
    const staffRes = await GET();
    const staffBody = await staffRes.json();
    expect(staffBody.operational).toBeDefined();

    mockAuth.mockResolvedValueOnce({ user: { id: 'u-m', role: 'gestionnaire' } });
    const mgrRes = await GET();
    const mgrBody = await mgrRes.json();
    expect(mgrBody.operational).toBeDefined();
  });
});

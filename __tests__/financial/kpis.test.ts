jest.mock('@/lib/auth/guard', () => ({ requireGestionnaire: jest.fn() }));
jest.mock('@/lib/financial/kpis', () => ({ fetchKpisForMonth: jest.fn() }));

import { requireGestionnaire } from '@/lib/auth/guard';
import { fetchKpisForMonth } from '@/lib/financial/kpis';
import { GET } from '@/app/api/financial/kpis/route';

const mockGuard = requireGestionnaire as jest.Mock;
const mockFetch = fetchKpisForMonth as jest.Mock;

describe('NSLRMP-13 — Gestionnaire KPI cards (S2a)', () => {
  afterEach(() => jest.resetAllMocks());

  it('returns 401 when guard denies', async () => {
    mockGuard.mockResolvedValueOnce(new Response(null, { status: 401 }));
    const res = await GET();
    expect(res.status).toBe(401);
  });

  describe('AC1 — 4 KPI cards from current-month Neon data', () => {
    it('returns ca, tresorerie, margebrute, alerteSeuil', async () => {
      mockGuard.mockResolvedValueOnce(null);
      mockFetch.mockResolvedValueOnce({ ca: 18000, tresorerie: 4500, margebrute: 65.5, alerteSeuil: false });
      const body = await (await GET()).json();
      expect(body).toMatchObject({ ca: 18000, tresorerie: 4500, margebrute: 65.5, alerteSeuil: false });
    });
  });

  describe('AC2 — trésorerie colour logic (API carries sign)', () => {
    it('negative trésorerie is returned as-is (UI colours red)', async () => {
      mockGuard.mockResolvedValueOnce(null);
      mockFetch.mockResolvedValueOnce({ ca: 10000, tresorerie: -2500, margebrute: 40, alerteSeuil: null });
      const body = await (await GET()).json();
      expect(body.tresorerie).toBeLessThan(0);
    });
    it('positive trésorerie is returned as-is (UI colours green)', async () => {
      mockGuard.mockResolvedValueOnce(null);
      mockFetch.mockResolvedValueOnce({ ca: 10000, tresorerie: 3000, margebrute: 40, alerteSeuil: null });
      const body = await (await GET()).json();
      expect(body.tresorerie).toBeGreaterThan(0);
    });
  });

  describe('AC3 — no data → all nulls ("Données non disponibles")', () => {
    it('returns null for every KPI when no records exist', async () => {
      mockGuard.mockResolvedValueOnce(null);
      mockFetch.mockResolvedValueOnce({ ca: null, tresorerie: null, margebrute: null, alerteSeuil: null });
      const body = await (await GET()).json();
      expect(body.ca).toBeNull();
      expect(body.tresorerie).toBeNull();
      expect(body.margebrute).toBeNull();
      expect(body.alerteSeuil).toBeNull();
    });
  });
});

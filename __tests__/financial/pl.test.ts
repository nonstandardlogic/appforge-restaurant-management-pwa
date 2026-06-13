jest.mock('@/lib/auth/guard', () => ({ requireGestionnaire: jest.fn() }));
jest.mock('@/lib/financial/pl', () => ({ fetchMonthlyPL: jest.fn() }));

import { requireGestionnaire } from '@/lib/auth/guard';
import { fetchMonthlyPL } from '@/lib/financial/pl';
import { GET } from '@/app/api/financial/pl/route';

const mockGuard = requireGestionnaire as jest.Mock;
const mockFetch = fetchMonthlyPL as jest.Mock;

const samplePL = {
  month: 6, year: 2026,
  revenues: [
    { category: 'Ventes repas', tvaRate: 10, total: 15000 },
    { category: 'Ventes boissons', tvaRate: 20, total: 5000 },
  ],
  charges: [{ category: 'Achats marchandises', tvaRate: null, total: 8000 }],
  totalRevenue: 20000, totalCharges: 8000, result: 12000,
  tva10: 1500, tva20: 1000,
};

describe('NSLRMP-14 — Monthly P&L (PCG 82)', () => {
  afterEach(() => jest.resetAllMocks());

  describe('AC1 — PCG 82 structure: classe 7 revenues + classe 6 charges', () => {
    it('response contains revenues and charges arrays', async () => {
      mockGuard.mockResolvedValueOnce(null);
      mockFetch.mockResolvedValueOnce(samplePL);
      const body = await (await GET(new Request('http://localhost/api/financial/pl?month=6&year=2026'))).json();
      expect(Array.isArray(body.revenues)).toBe(true);
      expect(Array.isArray(body.charges)).toBe(true);
      expect(body.totalRevenue).toBe(20000);
      expect(body.totalCharges).toBe(8000);
      expect(body.result).toBe(12000);
    });
  });

  describe('AC2 — TVA 10% and 20% as separate line items, never aggregated', () => {
    it('tva10 and tva20 are separate numeric fields', async () => {
      mockGuard.mockResolvedValueOnce(null);
      mockFetch.mockResolvedValueOnce(samplePL);
      const body = await (await GET(new Request('http://localhost/api/financial/pl'))).json();
      expect(typeof body.tva10).toBe('number');
      expect(typeof body.tva20).toBe('number');
    });
    it('revenue items carry individual tvaRate (10 or 20)', async () => {
      mockGuard.mockResolvedValueOnce(null);
      mockFetch.mockResolvedValueOnce(samplePL);
      const body = await (await GET(new Request('http://localhost/api/financial/pl'))).json();
      const rates: number[] = body.revenues.map((r: { tvaRate: number }) => r.tvaRate);
      expect(rates).toContain(10);
      expect(rates).toContain(20);
    });
  });

  describe('AC3 — month picker fetches historical data with same PCG structure', () => {
    it('passes month+year query params to fetchMonthlyPL', async () => {
      mockGuard.mockResolvedValueOnce(null);
      mockFetch.mockResolvedValueOnce({ ...samplePL, month: 3, year: 2025 });
      await GET(new Request('http://localhost/api/financial/pl?month=3&year=2025'));
      expect(mockFetch).toHaveBeenCalledWith(3, 2025);
    });
    it('returns 400 for invalid month (13)', async () => {
      mockGuard.mockResolvedValueOnce(null);
      const res = await GET(new Request('http://localhost/api/financial/pl?month=13&year=2026'));
      expect(res.status).toBe(400);
    });
  });
});

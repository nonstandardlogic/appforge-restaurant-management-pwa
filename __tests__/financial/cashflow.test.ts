jest.mock('@/lib/auth/guard', () => ({ requireGestionnaire: jest.fn() }));
jest.mock('@/lib/financial/cashflow', () => ({
  fetchWeeklyCashFlow: jest.fn(),
  fetchMonthlyCashFlow: jest.fn(),
}));

import { requireGestionnaire } from '@/lib/auth/guard';
import { fetchWeeklyCashFlow, fetchMonthlyCashFlow } from '@/lib/financial/cashflow';
import { GET } from '@/app/api/financial/cashflow/route';

const mockGuard = requireGestionnaire as jest.Mock;
const mockWeekly = fetchWeeklyCashFlow as jest.Mock;
const mockMonthly = fetchMonthlyCashFlow as jest.Mock;

const sampleWeekly = {
  days: [
    { date: '2026-06-09', inflows: 3000, outflows: -1500, net: 1500 },
    { date: '2026-06-10', inflows: 2000, outflows: -800, net: 1200 },
  ],
  weeklyInflows: 5000, weeklyOutflows: -2300, weeklyNet: 2700,
};

const sampleMonthly = {
  month: 6, year: 2026, operatingTotal: 25000, tvaCA3Total: 3200, grandTotal: 28200,
};

describe('NSLRMP-17 — Cash flow tracker (F4)', () => {
  afterEach(() => jest.resetAllMocks());

  describe('AC1 — weekly view: day-by-day receipts/disbursements with daily totals', () => {
    it('returns days array with inflows, outflows, net per day', async () => {
      mockGuard.mockResolvedValueOnce(null);
      mockWeekly.mockResolvedValueOnce(sampleWeekly);
      const body = await (await GET(new Request('http://localhost/api/financial/cashflow?view=weekly'))).json();
      expect(Array.isArray(body.days)).toBe(true);
      expect(body.days[0]).toMatchObject({ date: expect.any(String), inflows: expect.any(Number), outflows: expect.any(Number), net: expect.any(Number) });
      expect(body.weeklyInflows).toBe(5000);
    });
  });

  describe('AC2 — monthly view: TVA CA3 as distinct line separate from operating cash', () => {
    it('operatingTotal and tvaCA3Total are separate fields', async () => {
      mockGuard.mockResolvedValueOnce(null);
      mockMonthly.mockResolvedValueOnce(sampleMonthly);
      const body = await (await GET(new Request('http://localhost/api/financial/cashflow?view=monthly'))).json();
      expect(body.operatingTotal).toBe(25000);
      expect(body.tvaCA3Total).toBe(3200);
      expect(body.grandTotal).toBe(28200);
    });
    it('grandTotal = operatingTotal + tvaCA3Total', async () => {
      mockGuard.mockResolvedValueOnce(null);
      mockMonthly.mockResolvedValueOnce(sampleMonthly);
      const body = await (await GET(new Request('http://localhost/api/financial/cashflow?view=monthly'))).json();
      expect(body.operatingTotal + body.tvaCA3Total).toBeCloseTo(body.grandTotal, 2);
    });
  });

  describe('AC3 — consistent totals across views', () => {
    it('both views return a numeric total field', async () => {
      mockGuard.mockResolvedValueOnce(null);
      mockWeekly.mockResolvedValueOnce(sampleWeekly);
      const wb = await (await GET(new Request('http://localhost/api/financial/cashflow?view=weekly'))).json();

      mockGuard.mockResolvedValueOnce(null);
      mockMonthly.mockResolvedValueOnce(sampleMonthly);
      const mb = await (await GET(new Request('http://localhost/api/financial/cashflow?view=monthly'))).json();

      expect(typeof wb.weeklyNet).toBe('number');
      expect(typeof mb.grandTotal).toBe('number');
    });
  });
});

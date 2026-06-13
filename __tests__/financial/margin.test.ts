import { computeCategoryMargin, computeGrossMargins, MARGIN_CATEGORIES } from '@/lib/financial/margin';

const sampleInputs = MARGIN_CATEGORIES.map((name, i) => ({
  name, ca: 10000 + i * 1000, openingStock: 2000, purchases: 5000, closingStock: 3000,
}));

describe('NSLRMP-16 — Gross margin % (5 categories, real inventory)', () => {
  describe('AC1 — MB% = (CA - (opening + purchases - closing)) / CA × 100', () => {
    it('computes costOfGoods and margebrute correctly', () => {
      const r = computeCategoryMargin({ name: 'T', ca: 20000, openingStock: 2000, purchases: 8000, closingStock: 3000 });
      // CoG = 2000+8000-3000 = 7000; MB% = (20000-7000)/20000*100 = 65
      expect(r.costOfGoods).toBe(7000);
      expect(r.margebrute).toBeCloseTo(65, 2);
    });
    it('computes all 5 categories', () => {
      const report = computeGrossMargins(sampleInputs);
      expect(report.categories).toHaveLength(5);
      report.categories.forEach(c => expect(typeof c.margebrute).toBe('number'));
    });
  });

  describe('AC2 — each category row + global consolidated total', () => {
    it('returns one result per input with matching name', () => {
      const report = computeGrossMargins(sampleInputs);
      expect(report.categories.map(c => c.name)).toEqual([...MARGIN_CATEGORIES]);
    });
    it('globalMarge matches consolidated calculation', () => {
      const report = computeGrossMargins(sampleInputs);
      const totalCA = sampleInputs.reduce((s, i) => s + i.ca, 0);
      const totalCoG = sampleInputs.reduce((s, i) => s + i.openingStock + i.purchases - i.closingStock, 0);
      const expected = Number(((totalCA - totalCoG) / totalCA * 100).toFixed(2));
      expect(report.globalMarge).toBeCloseTo(expected, 2);
    });
  });

  describe('AC3 — colour-coding: green ≥30%, orange 20–29%, red <20%', () => {
    it('MB% = 40% → green', () => {
      const r = computeCategoryMargin({ name: 'T', ca: 10000, openingStock: 0, purchases: 6000, closingStock: 0 });
      expect(r.margebrute).toBe(40);
      expect(r.color).toBe('green');
    });
    it('MB% = 25% → orange', () => {
      const r = computeCategoryMargin({ name: 'T', ca: 10000, openingStock: 0, purchases: 7500, closingStock: 0 });
      expect(r.margebrute).toBe(25);
      expect(r.color).toBe('orange');
    });
    it('MB% = 15% → red', () => {
      const r = computeCategoryMargin({ name: 'T', ca: 10000, openingStock: 0, purchases: 8500, closingStock: 0 });
      expect(r.margebrute).toBe(15);
      expect(r.color).toBe('red');
    });
    it('globalColor reflects consolidated MB%', () => {
      const report = computeGrossMargins([{ name: 'A', ca: 10000, openingStock: 0, purchases: 6000, closingStock: 0 }]);
      expect(report.globalColor).toBe('green');
    });
  });
});

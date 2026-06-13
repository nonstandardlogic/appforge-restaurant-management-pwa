import { computeBreakEven } from '@/lib/financial/break-even';

describe('NSLRMP-15 — Break-even calculator (CCN HCR 39h/week)', () => {
  describe('AC1 — seuil de rentabilité computed using CCN HCR 39h/week', () => {
    it('computes seuil = CF / TMCV correctly', () => {
      const r = computeBreakEven({ chargesFixees: 8000, chargesVariables: 5000, caHT: 20000, proportionFood: 0.7 });
      // TMCV = 1 - 5000/20000 = 0.75; SR = 8000/0.75 ≈ 10666.67
      expect(r.seuilRentabilite).toBeCloseTo(10666.67, 2);
    });
    it('result includes CCN HCR 39h label', () => {
      const r = computeBreakEven({ chargesFixees: 5000, chargesVariables: 3000, caHT: 15000, proportionFood: 1 });
      expect(r.labelCCNHCR).toBe('CCN HCR — 39h/semaine');
    });
    it('returns 0 when CA is 0', () => {
      const r = computeBreakEven({ chargesFixees: 5000, chargesVariables: 0, caHT: 0, proportionFood: 0.7 });
      expect(r.seuilRentabilite).toBe(0);
    });
  });

  describe('AC2 — TVA structure (10% food / 20% alcohol) factored into revenue', () => {
    it('100% food → tvaEffective = 0.10', () => {
      const r = computeBreakEven({ chargesFixees: 5000, chargesVariables: 3000, caHT: 20000, proportionFood: 1 });
      expect(r.tvaEffective).toBeCloseTo(0.10, 4);
    });
    it('100% alcohol → tvaEffective = 0.20', () => {
      const r = computeBreakEven({ chargesFixees: 5000, chargesVariables: 3000, caHT: 20000, proportionFood: 0 });
      expect(r.tvaEffective).toBeCloseTo(0.20, 4);
    });
    it('70% food + 30% alcohol → tvaEffective = 0.13', () => {
      const r = computeBreakEven({ chargesFixees: 5000, chargesVariables: 3000, caHT: 20000, proportionFood: 0.7 });
      expect(r.tvaEffective).toBeCloseTo(0.13, 4);
    });
  });

  describe('AC3 — real-time recalculation (pure function)', () => {
    it('higher chargesFixees → higher seuil', () => {
      const r1 = computeBreakEven({ chargesFixees: 5000, chargesVariables: 3000, caHT: 10000, proportionFood: 0.7 });
      const r2 = computeBreakEven({ chargesFixees: 6000, chargesVariables: 3000, caHT: 10000, proportionFood: 0.7 });
      expect(r2.seuilRentabilite).toBeGreaterThan(r1.seuilRentabilite);
    });
    it('lower chargesVariables → higher TMCV', () => {
      const r1 = computeBreakEven({ chargesFixees: 5000, chargesVariables: 4000, caHT: 10000, proportionFood: 0.7 });
      const r2 = computeBreakEven({ chargesFixees: 5000, chargesVariables: 2000, caHT: 10000, proportionFood: 0.7 });
      expect(r2.tauxMargeCoutsVariables).toBeGreaterThan(r1.tauxMargeCoutsVariables);
    });
  });
});

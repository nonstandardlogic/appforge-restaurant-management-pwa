import { RBAC_MATRIX, ROLES, hasAccess } from '@/lib/rbac/matrix';

describe('NSLRMP-12 — RBAC permissions matrix', () => {
  it('contains exactly 9 features (F1–F9)', () => {
    expect(RBAC_MATRIX).toHaveLength(9);
    for (let i = 1; i <= 9; i++) {
      expect(RBAC_MATRIX.map((f) => f.id)).toContain(`F${i}`);
    }
  });

  it('defines boolean access for both roles on every feature', () => {
    for (const feature of RBAC_MATRIX) {
      expect(typeof feature.access.gestionnaire).toBe('boolean');
      expect(typeof feature.access.staff).toBe('boolean');
    }
  });

  it('gestionnaire has access to all 9 features', () => {
    for (const feature of RBAC_MATRIX) {
      expect(feature.access.gestionnaire).toBe(true);
    }
  });

  it('staff has no access to financial/admin features (F2, F3, F4, F8, F9)', () => {
    const restricted = ['F2', 'F3', 'F4', 'F8', 'F9'];
    for (const id of restricted) {
      expect(hasAccess('staff', id)).toBe(false);
    }
  });

  it('staff has access to operational features (F1, F5, F6, F7)', () => {
    const operational = ['F1', 'F5', 'F6', 'F7'];
    for (const id of operational) {
      expect(hasAccess('staff', id)).toBe(true);
    }
  });

  it('exports exactly 2 roles', () => {
    expect(ROLES).toHaveLength(2);
    expect(ROLES).toContain('gestionnaire');
    expect(ROLES).toContain('staff');
  });

  it('hasAccess returns false for unknown feature IDs', () => {
    expect(hasAccess('gestionnaire', 'F99')).toBe(false);
    expect(hasAccess('staff', 'UNKNOWN')).toBe(false);
  });
});

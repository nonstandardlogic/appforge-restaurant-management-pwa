import { authConfig } from '../../lib/auth/config';

// Cast callbacks for direct invocation in unit tests
const jwtCallback = authConfig.callbacks!.jwt as (
  params: { token: Record<string, unknown>; user?: Record<string, unknown> }
) => Record<string, unknown>;

const sessionCallback = authConfig.callbacks!.session as (
  params: { session: Record<string, unknown>; token: Record<string, unknown> }
) => Record<string, unknown>;

describe('NSLRMP-25 — NextAuth.js JWT configuration', () => {
  describe('jwt callback — role stored in token at login time', () => {
    it('embeds id, role and locale in JWT when user object is present (first login)', () => {
      const token = jwtCallback({
        token: {},
        user: {
          id: 'u-gestionnaire-1',
          email: 'chef@restaurant.fr',
          role: 'gestionnaire',
          locale: 'fr',
        },
      });

      expect(token.id).toBe('u-gestionnaire-1');
      expect(token.role).toBe('gestionnaire');
      expect(token.locale).toBe('fr');
    });

    it('embeds staff role when a staff user logs in', () => {
      const token = jwtCallback({
        token: {},
        user: { id: 'u-staff-1', email: 'staff@restaurant.fr', role: 'staff', locale: 'en' },
      });

      expect(token.role).toBe('staff');
      expect(token.locale).toBe('en');
    });

    it('does not modify existing token on subsequent requests (no user object = not a login)', () => {
      const existing = { id: 'u-1', role: 'gestionnaire', locale: 'fr', iat: 1_000_000 };
      const token = jwtCallback({ token: { ...existing } });

      expect(token).toMatchObject(existing);
    });
  });

  describe('session callback — role read from token (no DB call for route decisions)', () => {
    it('maps id, role and locale from JWT token to session.user', () => {
      const session = {
        user: { name: null, email: 'chef@restaurant.fr', image: null },
        expires: '2999-01-01',
      };
      const tokenPayload = { id: 'u-1', role: 'gestionnaire', locale: 'fr' };

      const result = sessionCallback({ session, token: tokenPayload }) as {
        user: { id: string; role: string; locale: string };
      };

      expect(result.user.id).toBe('u-1');
      expect(result.user.role).toBe('gestionnaire');
      expect(result.user.locale).toBe('fr');
    });
  });

  describe('signIn page — expired or missing JWT redirects to S1 (Connexion)', () => {
    it('uses /login as the designated signIn page', () => {
      expect(authConfig.pages?.signIn).toBe('/login');
    });
  });
});

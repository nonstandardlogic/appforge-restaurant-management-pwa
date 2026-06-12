import type { NextAuthConfig, Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

/**
 * Base NextAuth config — pure callbacks, no providers.
 * Exported separately so callbacks can be unit-tested without DB / bcrypt.
 * See lib/auth/index.ts for the full initialisation with CredentialsProvider.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        // Embed role + locale at login time — sourced from the users table.
        // All subsequent requests read from the token; no DB round-trip needed.
        token.id = user.id as string;
        token.role = (user as User & { role: string }).role;
        token.locale = (user as User & { locale: string }).locale;
      }
      return token;
    },
    session({ session, token }: { session: Session; token: JWT }) {
      session.user.id = (token as JWT & { id: string }).id;
      session.user.role = (token as JWT & { role: string }).role;
      session.user.locale = (token as JWT & { locale: string }).locale;
      return session;
    },
  },
  pages: {
    // Expired / missing JWT redirects to S1 — Connexion
    signIn: '/login',
  },
  providers: [],
};

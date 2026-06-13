import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import { authConfig } from './config';

// Use neon() directly so this module stays independent of lib/db/client's export shape.
// neon() is stateless (HTTP driver) — creating an instance per invocation is fine.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const sql = neon(process.env.DATABASE_URL!);
        const rows = await sql`
          SELECT id, email, password_hash, role, locale
          FROM users
          WHERE email = ${credentials.email as string}
        `;

        const user = rows[0];
        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash as string,
        );
        if (!valid) return null;

        return {
          id: user.id as string,
          email: user.email as string,
          role: user.role as string,
          locale: user.locale as string,
        };
      },
    }),
  ],
});

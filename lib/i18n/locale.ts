import { cookies } from 'next/headers';
import { getDb } from '@/lib/db/client';

export type Locale = 'fr' | 'en';
export const VALID_LOCALES: Locale[] = ['fr', 'en'];

export function getLocale(): Locale {
  const store = cookies();
  const value = store.get('locale')?.value;
  return value === 'en' ? 'en' : 'fr';
}

export async function persistLocale(userId: string, locale: Locale): Promise<void> {
  const sql = getDb();
  await (sql`
    UPDATE users SET locale = ${locale} WHERE id = ${userId}
  ` as unknown as Promise<void>);
}

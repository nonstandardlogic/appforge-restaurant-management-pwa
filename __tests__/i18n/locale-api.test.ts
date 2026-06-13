jest.mock('@/lib/db/client', () => ({ getDb: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn().mockReturnValue(undefined) })),
}));

import { getDb } from '@/lib/db/client';
import { persistLocale, getLocale } from '@/lib/i18n/locale';

const mockSql = jest.fn().mockResolvedValue([]);
(getDb as jest.Mock).mockReturnValue(mockSql);

describe('lib/i18n/locale — persistLocale', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls UPDATE users SET locale with user id and locale interpolated', async () => {
    await persistLocale('user-123', 'en');
    expect(getDb).toHaveBeenCalled();
    const callArgs: unknown[] = mockSql.mock.calls[0].slice(1);
    expect(callArgs).toContain('en');
    expect(callArgs).toContain('user-123');
  });

  it('accepts fr locale', async () => {
    await persistLocale('user-456', 'fr');
    const callArgs: unknown[] = mockSql.mock.calls[0].slice(1);
    expect(callArgs).toContain('fr');
    expect(callArgs).toContain('user-456');
  });
});

describe('lib/i18n/locale — getLocale', () => {
  it('returns fr when locale cookie is absent', () => {
    const { cookies } = jest.requireMock('next/headers') as { cookies: jest.Mock };
    cookies.mockReturnValue({ get: jest.fn().mockReturnValue(undefined) });
    expect(getLocale()).toBe('fr');
  });

  it('returns en when locale cookie value is en', () => {
    const { cookies } = jest.requireMock('next/headers') as { cookies: jest.Mock };
    cookies.mockReturnValue({ get: jest.fn().mockReturnValue({ value: 'en' }) });
    expect(getLocale()).toBe('en');
  });

  it('returns fr when locale cookie value is fr', () => {
    const { cookies } = jest.requireMock('next/headers') as { cookies: jest.Mock };
    cookies.mockReturnValue({ get: jest.fn().mockReturnValue({ value: 'fr' }) });
    expect(getLocale()).toBe('fr');
  });

  it('returns fr for an unrecognised locale cookie value (security default)', () => {
    const { cookies } = jest.requireMock('next/headers') as { cookies: jest.Mock };
    cookies.mockReturnValue({ get: jest.fn().mockReturnValue({ value: 'de' }) });
    expect(getLocale()).toBe('fr');
  });
});

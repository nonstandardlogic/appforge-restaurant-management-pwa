jest.mock('@/lib/auth', () => ({ signIn: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next-auth', () => ({
  AuthError: class AuthError extends Error {
    constructor(msg?: string) {
      super(msg ?? 'AuthError');
      this.name = 'AuthError';
    }
  },
}));

import { signIn } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { loginAction } from '@/app/login/actions';

const mockSignIn = signIn as jest.Mock;
const mockRedirect = redirect as jest.Mock;

describe('NSLRMP-8 — Login server action (S1)', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('calls signIn with credentials and redirectTo=/dashboard on valid submit', async () => {
    mockSignIn.mockResolvedValueOnce(undefined);

    const formData = new FormData();
    formData.append('email', 'chef@restaurant.fr');
    formData.append('password', 'secret123');

    await loginAction(formData);

    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      email: 'chef@restaurant.fr',
      password: 'secret123',
      redirectTo: '/dashboard',
    });
  });

  it('redirects to /login?error=invalid_credentials on AuthError', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AuthError } = require('next-auth');
    mockSignIn.mockRejectedValueOnce(new AuthError('CredentialsSignin'));

    const formData = new FormData();
    formData.append('email', 'wrong@test.fr');
    formData.append('password', 'bad-password');

    await loginAction(formData);

    expect(mockRedirect).toHaveBeenCalledWith('/login?error=invalid_credentials');
  });

  it('does not reveal which field caused the auth failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AuthError } = require('next-auth');
    mockSignIn.mockRejectedValueOnce(new AuthError('CredentialsSignin'));

    const formData = new FormData();
    formData.append('email', 'anyone@test.fr');
    formData.append('password', 'anything');

    await loginAction(formData);

    const redirectArg: string = mockRedirect.mock.calls[0][0];
    expect(redirectArg).not.toContain('email');
    expect(redirectArg).not.toContain('password');
  });

  it('re-throws non-AuthError errors (e.g. network failures)', async () => {
    const networkError = new Error('Network timeout');
    mockSignIn.mockRejectedValueOnce(networkError);

    const formData = new FormData();
    formData.append('email', 'test@test.fr');
    formData.append('password', 'pass');

    await expect(loginAction(formData)).rejects.toThrow('Network timeout');
  });
});

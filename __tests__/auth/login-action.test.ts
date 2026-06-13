jest.mock('@/lib/auth', () => ({ signIn: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));

import { signIn } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { loginAction } from '@/app/login/actions';

const mockSignIn = signIn as jest.Mock;
const mockRedirect = redirect as jest.Mock;

function makeAuthError(message = 'CredentialsSignin'): Error {
  const err = new Error(message);
  err.name = 'AuthError';
  return err;
}

describe('NSLRMP-8 — Login server action (S1)', () => {
  beforeEach(() => {
    // In the real Next.js runtime redirect() throws a NEXT_REDIRECT error.
    // Mirror that here so loginAction exits via the redirect path instead of
    // re-throwing the AuthError.  Re-applied in beforeEach because
    // jest.resetAllMocks() (afterEach) strips implementations.
    mockRedirect.mockImplementation((url: string) => {
      const err = new Error(url);
      err.name = 'NextRedirect';
      throw err;
    });
  });

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
    mockSignIn.mockRejectedValueOnce(makeAuthError());

    const formData = new FormData();
    formData.append('email', 'wrong@test.fr');
    formData.append('password', 'bad-password');

    try {
      await loginAction(formData);
    } catch {
      // redirect() throws in both real runtime and mock — expected
    }

    expect(mockRedirect).toHaveBeenCalledWith('/login?error=invalid_credentials');
  });

  it('does not reveal which field caused the auth failure', async () => {
    mockSignIn.mockRejectedValueOnce(makeAuthError());

    const formData = new FormData();
    formData.append('email', 'anyone@test.fr');
    formData.append('password', 'anything');

    try {
      await loginAction(formData);
    } catch {
      // redirect() throws — expected
    }

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

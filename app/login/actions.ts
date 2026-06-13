'use server';

import { signIn } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData): Promise<void> {
  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirectTo: '/dashboard',
    });
  } catch (error) {
    // AuthError instances from next-auth have name === 'AuthError'.
    // Checking by name avoids instanceof identity mismatch across module boundaries.
    if (error instanceof Error && error.name === 'AuthError') {
      redirect('/login?error=invalid_credentials');
    }
    throw error;
  }
}

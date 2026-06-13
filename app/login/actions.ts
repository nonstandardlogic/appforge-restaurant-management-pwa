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
    // Avoid instanceof Error — Jest vm boundaries can cause identity mismatch.
    // Check the name property directly; next-auth AuthErrors always set it.
    if ((error as any)?.name === 'AuthError') {
      redirect('/login?error=invalid_credentials');
    }
    throw error;
  }
}

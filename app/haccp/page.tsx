import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { HaccpForm } from './HaccpForm';

export const dynamic = 'force-dynamic';

export default async function HaccpPage() {
  const session = await auth();
  if (!session) redirect('/');

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-blue-600 hover:underline text-sm">
            ← Retour
          </a>
          <h1 className="text-2xl font-bold text-gray-900">Contrôle HACCP</h1>
        </div>
        <HaccpForm userId={session.user.id} />
      </div>
    </main>
  );
}

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { HoursForm } from './HoursForm';

export const dynamic = 'force-dynamic';

function getMondayOfCurrentWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

export default async function HoursPage() {
  const session = await auth();
  if (!session) redirect('/');

  const weekStart = getMondayOfCurrentWeek();

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-blue-600 hover:underline text-sm">
            ← Retour
          </a>
          <h1 className="text-2xl font-bold text-gray-900">
            Mes heures — semaine du {weekStart}
          </h1>
        </div>
        <HoursForm staffId={session.user.id} weekStart={weekStart} />
      </div>
    </main>
  );
}

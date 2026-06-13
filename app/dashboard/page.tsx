import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { fetchStaffDashboard } from '@/lib/staff/dashboard';

export const dynamic = 'force-dynamic';

const LOCATION_FR: Record<string, string> = {
  cold_room: 'Chambre froide',
  prep_area: 'Zone de préparation',
  dishwasher: 'Lave-vaisselle',
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/');

  const { checklistProgress, nextHaccpCheck, nonCompliantToday, allClear } =
    await fetchStaffDashboard(session.user.id);

  const progressPercent =
    checklistProgress.total > 0
      ? Math.round((checklistProgress.done / checklistProgress.total) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>

        {allClear && (
          <div className="bg-green-100 border border-green-400 text-green-800 rounded-lg p-4 text-center font-semibold text-lg">
            Tout est en ordre ✓
          </div>
        )}

        {nonCompliantToday > 0 && (
          <div className="bg-red-100 border border-red-400 text-red-800 rounded-lg p-4">
            <span className="font-semibold">⚠️ {nonCompliantToday} température(s) non conforme(s)</span>{' '}
            aujourd&apos;hui — action corrective requise
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Checklist d&apos;ouverture</h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">
              {checklistProgress.done}/{checklistProgress.total}
            </span>
          </div>
        </div>

        {nextHaccpCheck && (
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-1">Prochain contrôle HACCP</h2>
            <p className="text-gray-600">
              Zone :{' '}
              <span className="font-medium">
                {LOCATION_FR[nextHaccpCheck.location] ?? nextHaccpCheck.location}
              </span>
            </p>
            {nextHaccpCheck.lastChecked ? (
              <p className="text-sm text-gray-500">Dernier contrôle : {nextHaccpCheck.lastChecked}</p>
            ) : (
              <p className="text-sm text-orange-600 font-medium">Non contrôlé aujourd&apos;hui</p>
            )}
          </div>
        )}

        <nav className="grid grid-cols-2 gap-3 pt-2">
          <a
            href="/haccp"
            className="bg-blue-600 text-white rounded-lg p-4 text-center font-medium hover:bg-blue-700 transition-colors"
          >
            Températures HACCP
          </a>
          <a
            href="/checklist"
            className="bg-green-600 text-white rounded-lg p-4 text-center font-medium hover:bg-green-700 transition-colors"
          >
            Checklist ouverture
          </a>
          <a
            href="/hours"
            className="bg-purple-600 text-white rounded-lg p-4 text-center font-medium hover:bg-purple-700 transition-colors"
          >
            Mes heures
          </a>
          {session.user.role === 'gestionnaire' && (
            <a
              href="/planning"
              className="bg-indigo-600 text-white rounded-lg p-4 text-center font-medium hover:bg-indigo-700 transition-colors"
            >
              Planning équipe
            </a>
          )}
        </nav>
      </div>
    </main>
  );
}

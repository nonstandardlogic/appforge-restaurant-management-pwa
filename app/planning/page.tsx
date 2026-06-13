import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { fetchPlanningGrid } from '@/lib/staff/planning';
import { ValidatePlanningButton } from './ValidatePlanningButton';

export const dynamic = 'force-dynamic';

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getMondayOfCurrentWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

export default async function PlanningPage() {
  const session = await auth();
  if (!session) redirect('/');
  if (session.user.role !== 'gestionnaire') redirect('/dashboard');

  const weekStart = getMondayOfCurrentWeek();
  const grid = await fetchPlanningGrid(weekStart);

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-blue-600 hover:underline text-sm">
            ← Retour
          </a>
          <h1 className="text-2xl font-bold text-gray-900">
            Planning — semaine du {weekStart}
          </h1>
        </div>

        {grid.staff.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Aucune disponibilité soumise pour cette semaine.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Staff</th>
                  {DAY_NAMES.map((d) => (
                    <th key={d} className="px-3 py-2 font-medium text-gray-600 text-center">
                      {d}
                    </th>
                  ))}
                  <th className="px-4 py-2 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {grid.staff.map((member) => {
                  const byDay = new Map(member.days.map((d) => [d.day_of_week, d]));
                  const isValidated = member.days.length > 0 && member.days.every((d) => d.validated);

                  return (
                    <tr key={member.staff_id}>
                      <td className="px-4 py-3 font-medium text-gray-800">{member.email}</td>
                      {Array.from({ length: 7 }, (_, i) => {
                        const day = byDay.get(i + 1);
                        return (
                          <td key={i} className="px-3 py-3 text-center">
                            {day ? (
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  day.availability === 'DISPO'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {day.availability}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3">
                        {isValidated ? (
                          <span className="text-green-600 text-xs font-semibold">✓ Validé</span>
                        ) : (
                          <ValidatePlanningButton
                            staffId={member.staff_id}
                            weekStart={weekStart}
                            validatedBy={session.user.id}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getAllAlertConfigs } from '@/lib/alerts/config';
import AlertsConfigPanel from './AlertsConfigPanel';

export const dynamic = 'force-dynamic';

export default async function AlertsPage() {
  const session = await auth();
  if (!session) redirect('/');
  if (session.user.role !== 'gestionnaire') redirect('/dashboard');

  const configs = await getAllAlertConfigs();

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuration des alertes</h1>
      <AlertsConfigPanel initialConfigs={configs} />
    </main>
  );
}

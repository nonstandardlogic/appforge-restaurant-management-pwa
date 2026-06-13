import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tableau de bord — Restaurant Management',
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const { role } = session.user;

  return (
    <main style={{ padding: 32 }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Tableau de bord</h1>
        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href="/dashboard" style={{ color: '#1d4ed8' }}>Opérationnel</a>
          {role === 'gestionnaire' ? (
            <>
              <a href="/finances" style={{ color: '#1d4ed8' }}>Finances</a>
              <a href="/admin/users" style={{ color: '#1d4ed8' }}>Utilisateurs</a>
              <a href="/admin/permissions" style={{ color: '#1d4ed8' }}>Permissions</a>
            </>
          ) : (
            <span
              aria-disabled="true"
              aria-label="Finance — accès restreint (gestionnaire uniquement)"
              style={{ color: '#9ca3af', cursor: 'not-allowed' }}
            >
              Finance 🔒
            </span>
          )}
        </nav>
      </header>

      {role === 'gestionnaire' ? (
        <section aria-label="KPIs financiers">
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>KPIs Financiers</h2>
          <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, margin: 0 }}>
            <div style={{ padding: 20, background: '#f0f9ff', borderRadius: 8 }}>
              <dt style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Chiffre d&apos;affaires</dt>
              <dd data-kpi="ca" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>—</dd>
            </div>
            <div style={{ padding: 20, background: '#f0fdf4', borderRadius: 8 }}>
              <dt style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Trésorerie</dt>
              <dd data-kpi="tresorerie" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>—</dd>
            </div>
            <div style={{ padding: 20, background: '#fff7ed', borderRadius: 8 }}>
              <dt style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Marge brute</dt>
              <dd data-kpi="mb" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>—</dd>
            </div>
          </dl>
        </section>
      ) : (
        <section aria-label="Planning opérationnel">
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Planning du jour</h2>
          <p style={{ color: '#6b7280' }}>Aucun planning configuré pour le moment.</p>
        </section>
      )}
    </main>
  );
}

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { fetchKpisForMonth } from '@/lib/financial/kpis';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Tableau de bord — Finances' };

function formatEUR(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

export default async function FinancesPage() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'gestionnaire') redirect('/dashboard');

  const now = new Date();
  const kpis = await fetchKpisForMonth(now.getMonth() + 1, now.getFullYear());
  const label = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const tresorerieColor =
    kpis.tresorerie === null ? '#1f2937'
    : kpis.tresorerie < 0 ? '#dc2626'
    : '#16a34a';

  return (
    <main style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Tableau de bord — Finances</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>Mois : {label}</p>

      <dl aria-label="Indicateurs financiers clés"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>

        <div style={{ padding: 24, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
          <dt style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Chiffre d&apos;affaires du mois</dt>
          <dd data-kpi="ca" style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#1e40af' }}>
            {kpis.ca === null ? 'Données non disponibles' : formatEUR(kpis.ca)}
          </dd>
        </div>

        <div style={{ padding: 24, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <dt style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Trésorerie</dt>
          <dd data-kpi="tresorerie" style={{ fontSize: 22, fontWeight: 700, margin: 0, color: tresorerieColor }}>
            {kpis.tresorerie === null
              ? 'Données non disponibles'
              : kpis.tresorerie < 0
              ? `⚠ ${formatEUR(kpis.tresorerie)}`
              : formatEUR(kpis.tresorerie)}
          </dd>
        </div>

        <div style={{ padding: 24, background: '#fff7ed', borderRadius: 8, border: '1px solid #fed7aa' }}>
          <dt style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Marge brute</dt>
          <dd data-kpi="mb" style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#c2410c' }}>
            {kpis.margebrute === null ? 'Données non disponibles' : `${kpis.margebrute.toFixed(2)} %`}
          </dd>
        </div>

        <div style={{
          padding: 24,
          background: kpis.alerteSeuil === true ? '#fef2f2' : '#f0fdf4',
          borderRadius: 8,
          border: `1px solid ${kpis.alerteSeuil === true ? '#fecaca' : '#bbf7d0'}`,
        }}>
          <dt style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Alerte seuil CA</dt>
          <dd data-kpi="alerte-seuil" style={{
            fontSize: 22, fontWeight: 700, margin: 0,
            color: kpis.alerteSeuil === true ? '#dc2626' : '#16a34a',
          }}>
            {kpis.alerteSeuil === null
              ? 'Données non disponibles'
              : kpis.alerteSeuil ? '⚠ Seuil non atteint' : '✓ Seuil atteint'}
          </dd>
        </div>
      </dl>

      <nav style={{ marginTop: 32, display: 'flex', gap: 16 }}>
        <a href="/finances/pl" style={{ color: '#1d4ed8' }}>Compte de résultat</a>
        <a href="/finances/margin" style={{ color: '#1d4ed8' }}>Marge brute</a>
        <a href="/finances/break-even" style={{ color: '#1d4ed8' }}>Seuil de rentabilité</a>
        <a href="/finances/cashflow" style={{ color: '#1d4ed8' }}>Trésorerie</a>
      </nav>
    </main>
  );
}

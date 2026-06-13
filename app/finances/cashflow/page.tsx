import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { fetchWeeklyCashFlow, fetchMonthlyCashFlow } from '@/lib/financial/cashflow';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Trésorerie — Finances' };

function formatEUR(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

export default async function CashflowPage({
  searchParams,
}: {
  searchParams: { view?: string; month?: string; year?: string };
}) {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'gestionnaire') redirect('/dashboard');

  const view = searchParams.view === 'weekly' ? 'weekly' : 'monthly';
  const now = new Date();
  const month = Number(searchParams.month ?? now.getMonth() + 1);
  const year = Number(searchParams.year ?? now.getFullYear());

  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const weeklyData = view === 'weekly' ? await fetchWeeklyCashFlow(monday) : null;
  const monthlyData = view === 'monthly' ? await fetchMonthlyCashFlow(month, year) : null;

  return (
    <main style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Trésorerie (F4)</h1>

      <nav style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['weekly', 'monthly'] as const).map(v => (
          <a key={v} href={`?view=${v}`} style={{
            padding: '8px 16px', borderRadius: 6, textDecoration: 'none',
            background: view === v ? '#1d4ed8' : '#f3f4f6',
            color: view === v ? '#fff' : '#374151',
          }}>
            {v === 'weekly' ? 'Vue hebdomadaire' : 'Vue mensuelle'}
          </a>
        ))}
      </nav>

      {view === 'weekly' && weeklyData && (
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            Semaine du {monday.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                {['Jour', 'Encaissements', 'Décaissements', 'Net journalier'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', fontSize: 13, color: '#6b7280', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeklyData.days.map(day => (
                <tr key={day.date} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px' }}>
                    {new Date(day.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'short' })}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#16a34a' }}>{formatEUR(day.inflows)}</td>
                  <td style={{ padding: '8px 12px', color: '#dc2626' }}>{formatEUR(day.outflows)}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: day.net >= 0 ? '#16a34a' : '#dc2626' }}>{formatEUR(day.net)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f0f9ff', fontWeight: 700, borderTop: '2px solid #e5e7eb' }}>
                <td style={{ padding: '10px 12px' }}>Total semaine</td>
                <td style={{ padding: '10px 12px', color: '#16a34a' }}>{formatEUR(weeklyData.weeklyInflows)}</td>
                <td style={{ padding: '10px 12px', color: '#dc2626' }}>{formatEUR(weeklyData.weeklyOutflows)}</td>
                <td style={{ padding: '10px 12px', color: weeklyData.weeklyNet >= 0 ? '#16a34a' : '#dc2626' }}>{formatEUR(weeklyData.weeklyNet)}</td>
              </tr>
            </tfoot>
          </table>
        </section>
      )}

      {view === 'monthly' && monthlyData && (
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            {new Date(monthlyData.year, monthlyData.month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h2>
          <form method="GET" style={{ marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
            <input type="hidden" name="view" value="monthly" />
            <label htmlFor="mcf">Mois :</label>
            <input id="mcf" name="month" type="number" min="1" max="12" defaultValue={month}
              style={{ width: 60, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4 }} />
            <label htmlFor="ycf">Année :</label>
            <input id="ycf" name="year" type="number" min="2020" max="2100" defaultValue={year}
              style={{ width: 80, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4 }} />
            <button type="submit" style={{ padding: '4px 16px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Afficher</button>
          </form>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 16px' }}>Flux d&apos;exploitation</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: monthlyData.operatingTotal >= 0 ? '#16a34a' : '#dc2626' }}>
                  {formatEUR(monthlyData.operatingTotal)}
                </td>
              </tr>
              <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#fefce8' }}>
                <td style={{ padding: '12px 16px' }}>
                  TVA CA3 — déclaration trimestrielle
                  <span style={{ marginLeft: 8, fontSize: 12, background: '#fef9c3', color: '#854d0e', padding: '2px 6px', borderRadius: 4 }}>Distinct exploitation</span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#92400e' }}>
                  {formatEUR(monthlyData.tvaCA3Total)}
                </td>
              </tr>
              <tr style={{ background: '#f0f9ff', fontWeight: 700, fontSize: 16 }}>
                <td style={{ padding: '14px 16px' }}>Total trésorerie nette</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', color: monthlyData.grandTotal >= 0 ? '#166534' : '#dc2626' }}>
                  {formatEUR(monthlyData.grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

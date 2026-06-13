import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { fetchMonthlyPL } from '@/lib/financial/pl';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Compte de résultat — Finances' };

function formatEUR(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

export default async function PLPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'gestionnaire') redirect('/dashboard');

  const now = new Date();
  const month = Number(searchParams.month ?? now.getMonth() + 1);
  const year = Number(searchParams.year ?? now.getFullYear());
  const pl = await fetchMonthlyPL(month, year);
  const monthLabel = new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <main style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Compte de résultat (PCG 82)</h1>

      <form method="GET" style={{ marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
        <label htmlFor="month">Mois :</label>
        <input id="month" name="month" type="number" min="1" max="12" defaultValue={month}
          style={{ width: 60, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4 }} />
        <label htmlFor="year">Année :</label>
        <input id="year" name="year" type="number" min="2020" max="2100" defaultValue={year}
          style={{ width: 80, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4 }} />
        <button type="submit" style={{ padding: '4px 16px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Afficher
        </button>
      </form>

      <p style={{ color: '#6b7280', marginBottom: 24 }}>Période : {monthLabel}</p>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#166534' }}>Produits (Classe 7)</h2>
        {pl.revenues.length === 0 ? (
          <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>Aucun produit enregistré pour cette période.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13, color: '#6b7280' }}>Catégorie</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13, color: '#6b7280' }}>TVA</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 13, color: '#6b7280' }}>Montant HT</th>
              </tr>
            </thead>
            <tbody>
              {pl.revenues.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px' }}>{r.category}</td>
                  <td style={{ padding: '8px 12px' }}>
                    {r.tvaRate === 10
                      ? <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>TVA 10 %</span>
                      : r.tvaRate === 20
                      ? <span style={{ background: '#fef9c3', color: '#854d0e', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>TVA 20 %</span>
                      : '—'}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 500 }}>{formatEUR(r.total)}</td>
                </tr>
              ))}
              {pl.tva10 > 0 && (
                <tr style={{ background: '#f0fdf4' }}>
                  <td colSpan={2} style={{ padding: '8px 12px', fontSize: 13, color: '#166534' }}>dont TVA collectée 10 %</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 13, color: '#166534' }}>{formatEUR(pl.tva10)}</td>
                </tr>
              )}
              {pl.tva20 > 0 && (
                <tr style={{ background: '#fefce8' }}>
                  <td colSpan={2} style={{ padding: '8px 12px', fontSize: 13, color: '#854d0e' }}>dont TVA collectée 20 %</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 13, color: '#854d0e' }}>{formatEUR(pl.tva20)}</td>
                </tr>
              )}
              <tr style={{ fontWeight: 700, borderTop: '2px solid #e5e7eb' }}>
                <td colSpan={2} style={{ padding: '8px 12px' }}>Total produits</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatEUR(pl.totalRevenue)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#991b1b' }}>Charges (Classe 6)</h2>
        {pl.charges.length === 0 ? (
          <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>Aucune charge enregistrée pour cette période.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13, color: '#6b7280' }}>Catégorie</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 13, color: '#6b7280' }}>Montant</th>
              </tr>
            </thead>
            <tbody>
              {pl.charges.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px' }}>{c.category}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 500 }}>{formatEUR(c.total)}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 700, borderTop: '2px solid #e5e7eb' }}>
                <td style={{ padding: '8px 12px' }}>Total charges</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatEUR(pl.totalCharges)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </section>

      <div style={{ padding: 20, borderRadius: 8, background: pl.result >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${pl.result >= 0 ? '#bbf7d0' : '#fecaca'}` }}>
        <span style={{ fontWeight: 700, fontSize: 18 }}>Résultat net : </span>
        <span style={{ fontWeight: 700, fontSize: 20, color: pl.result >= 0 ? '#166534' : '#dc2626' }}>{formatEUR(pl.result)}</span>
      </div>
    </main>
  );
}

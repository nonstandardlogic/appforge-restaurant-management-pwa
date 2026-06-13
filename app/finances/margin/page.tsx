'use client';

import { useState } from 'react';
import { computeGrossMargins, MARGIN_CATEGORIES } from '@/lib/financial/margin';
import type { CategoryInput } from '@/lib/financial/margin';

const colorHex = { green: '#16a34a', orange: '#d97706', red: '#dc2626' } as const;

export default function MarginPage() {
  const [inputs, setInputs] = useState<CategoryInput[]>(
    MARGIN_CATEGORIES.map(name => ({ name, ca: 0, openingStock: 0, purchases: 0, closingStock: 0 }))
  );

  function upd(i: number, field: keyof CategoryInput, val: string) {
    setInputs(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: Number(val) };
      return next;
    });
  }

  const report = computeGrossMargins(inputs);

  return (
    <main style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Marge brute (S4)</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Méthode : inventaire réel — 5 catégories produits</p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              {['Catégorie', 'CA (€)', 'Stock initial (€)', 'Achats (€)', 'Stock final (€)', 'MB %'].map(h => (
                <th key={h} style={{ padding: '10px 8px', fontSize: 13, color: '#6b7280', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inputs.map((cat, i) => {
              const res = report.categories[i];
              return (
                <tr key={cat.name} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px', fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap' }}>{cat.name}</td>
                  {(['ca', 'openingStock', 'purchases', 'closingStock'] as const).map(field => (
                    <td key={field} style={{ padding: '4px 8px' }}>
                      <input type="number" min="0"
                        style={{ width: 90, padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 4 }}
                        value={cat[field] || ''} placeholder="0"
                        onChange={e => upd(i, field, e.target.value)} />
                    </td>
                  ))}
                  <td style={{ padding: '8px', fontWeight: 700, color: colorHex[res.color] }}>
                    {cat.ca > 0 ? `${res.margebrute.toFixed(2)} %` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f0f9ff', fontWeight: 700, borderTop: '2px solid #e5e7eb' }}>
              <td style={{ padding: '10px 8px' }}>Total</td>
              <td style={{ padding: '10px 8px' }}>{report.totalCA.toFixed(2)} €</td>
              <td colSpan={3} />
              <td style={{ padding: '10px 8px', color: colorHex[report.globalColor] }}>
                {report.totalCA > 0 ? `${report.globalMarge.toFixed(2)} %` : '—'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {report.totalCA > 0 && (
        <div style={{ padding: 20, borderRadius: 8,
          background: report.globalColor === 'green' ? '#f0fdf4' : report.globalColor === 'orange' ? '#fffbeb' : '#fef2f2',
          border: `1px solid ${report.globalColor === 'green' ? '#bbf7d0' : report.globalColor === 'orange' ? '#fde68a' : '#fecaca'}`,
        }}>
          <strong>Marge brute globale consolidée : </strong>
          <span style={{ fontSize: 20, fontWeight: 700, color: colorHex[report.globalColor] }}>
            {report.globalMarge.toFixed(2)} %
          </span>
          <span style={{ marginLeft: 8, fontSize: 13, color: '#6b7280' }}>
            ({report.globalColor === 'green' ? '✓ Bonne' : '⚠ À surveiller'})
          </span>
        </div>
      )}
    </main>
  );
}

'use client';

import { useState } from 'react';

function compute(cf: number, cv: number, ca: number, pf: number) {
  const tvaEff = pf * 0.10 + (1 - pf) * 0.20;
  if (ca <= 0 || cv >= ca) return { seuil: 0, tmcv: 0, tva: Number((tvaEff * 100).toFixed(2)) };
  const tmcv = 1 - cv / ca;
  return {
    seuil: Number((cf / tmcv).toFixed(2)),
    tmcv: Number((tmcv * 100).toFixed(2)),
    tva: Number((tvaEff * 100).toFixed(2)),
  };
}

const inp = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 16, marginTop: 4 };

export default function BreakEvenPage() {
  const [cf, setCf] = useState(0);
  const [cv, setCv] = useState(0);
  const [ca, setCa] = useState(0);
  const [pf, setPf] = useState(0.7);

  const r = compute(cf, cv, ca, pf);
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

  return (
    <main style={{ padding: 32, maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Seuil de rentabilité (F1)</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Référence : <strong>CCN HCR — 39 h/semaine</strong> — TVA : 10 % repas / 20 % alcool
      </p>

      <div style={{ display: 'grid', gap: 16, marginBottom: 32 }}>
        <label>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Charges fixes mensuelles (€ HT)</span>
          <input type="number" min="0" style={inp} value={cf || ''} placeholder="ex : 8000"
            onChange={e => setCf(Number(e.target.value))} />
        </label>
        <label>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Charges variables mensuelles (€ HT)</span>
          <input type="number" min="0" style={inp} value={cv || ''} placeholder="ex : 5000"
            onChange={e => setCv(Number(e.target.value))} />
        </label>
        <label>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Chiffre d&apos;affaires mensuel (€ HT)</span>
          <input type="number" min="0" style={inp} value={ca || ''} placeholder="ex : 20000"
            onChange={e => setCa(Number(e.target.value))} />
        </label>
        <label>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Part repas (TVA 10 %) : {Math.round(pf * 100)} %</span>
          <input type="range" min="0" max="100" style={{ width: '100%', marginTop: 8 }}
            value={Math.round(pf * 100)}
            onChange={e => setPf(Number(e.target.value) / 100)} />
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            {Math.round(pf * 100)} % repas (TVA 10 %) / {Math.round((1 - pf) * 100)} % alcool (TVA 20 %)
          </span>
        </label>
      </div>

      <div style={{ padding: 24, background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Résultat (temps réel)</h2>
        <dl style={{ display: 'grid', gap: 12 }}>
          <div>
            <dt style={{ fontSize: 13, color: '#6b7280' }}>Seuil de rentabilité</dt>
            <dd data-result="seuil" style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1e40af' }}>
              {r.seuil > 0 ? fmt(r.seuil) : '—'}
            </dd>
          </div>
          <div>
            <dt style={{ fontSize: 13, color: '#6b7280' }}>Taux de marge sur coûts variables (TMCV)</dt>
            <dd data-result="tmcv" style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
              {r.tmcv > 0 ? `${r.tmcv} %` : '—'}
            </dd>
          </div>
          <div>
            <dt style={{ fontSize: 13, color: '#6b7280' }}>TVA effective (mix repas/alcool)</dt>
            <dd data-result="tva" style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{r.tva} %</dd>
          </div>
        </dl>
      </div>
    </main>
  );
}

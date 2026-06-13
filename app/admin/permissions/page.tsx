import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { RBAC_MATRIX, ROLES } from '@/lib/rbac/matrix';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Matrice des permissions (S8) — Restaurant Management',
};

export default async function PermissionsPage() {
  const session = await auth();
  if (!session || session.user.role !== 'gestionnaire') {
    redirect('/dashboard');
  }

  return (
    <main style={{ padding: 32 }}>
      <header style={{ marginBottom: 24 }}>
        <a href="/admin/users" style={{ color: '#6b7280', fontSize: 14 }}>← Gestion utilisateurs</a>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>Matrice des permissions RBAC</h1>
        <p style={{ color: '#6b7280' }}>Vue d&apos;ensemble des droits d&apos;accès par rôle (F1–F9).</p>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', border: '1px solid #e5e7eb', fontWeight: 600 }}>
                Fonctionnalité
              </th>
              {ROLES.map((role) => (
                <th
                  key={role}
                  scope="col"
                  style={{ padding: '12px 16px', textAlign: 'center', border: '1px solid #e5e7eb', fontWeight: 600, textTransform: 'capitalize', width: 140 }}
                >
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RBAC_MATRIX.map((feature, i) => (
              <tr key={feature.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb' }}>
                  <strong style={{ marginRight: 8, color: '#6b7280', fontFamily: 'monospace' }}>{feature.id}</strong>
                  {feature.label}
                </td>
                {ROLES.map((role) => (
                  <td
                    key={role}
                    style={{ padding: '12px 16px', textAlign: 'center', border: '1px solid #e5e7eb', fontSize: 18 }}
                    aria-label={feature.access[role] ? 'Accès autorisé' : 'Accès refusé'}
                  >
                    {feature.access[role] ? '✓' : '✗'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

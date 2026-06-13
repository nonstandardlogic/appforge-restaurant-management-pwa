import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestion utilisateurs (S9) — Restaurant Management',
};

export default async function UsersPage() {
  const session = await auth();
  if (!session || session.user.role !== 'gestionnaire') {
    redirect('/dashboard');
  }

  return (
    <main style={{ padding: 32 }}>
      <header style={{ marginBottom: 24 }}>
        <a href="/dashboard" style={{ color: '#6b7280', fontSize: 14 }}>← Retour au tableau de bord</a>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>Gestion des utilisateurs</h1>
        <p style={{ color: '#6b7280' }}>
          Créez des comptes, assignez des rôles et réinitialisez les mots de passe.
        </p>
      </header>
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Utilisateurs</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <a
              href="/admin/permissions"
              style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6, color: '#374151', textDecoration: 'none', fontSize: 14 }}
            >
              Voir les permissions
            </a>
            <button
              style={{ padding: '8px 16px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
            >
              + Nouvel utilisateur
            </button>
          </div>
        </div>
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          Utilisez l&apos;API <code>/api/admin/users</code> pour gérer les comptes.
        </p>
      </section>
    </main>
  );
}

import { loginAction } from './actions';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const errorMessage =
    searchParams.error === 'invalid_credentials'
      ? 'Identifiants incorrects. Vérifiez votre email et votre mot de passe.'
      : searchParams.error
        ? 'Une erreur est survenue. Veuillez réessayer.'
        : null;

  return (
    <main style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 360, padding: 32, border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <h1 style={{ marginBottom: 8, fontSize: 24, fontWeight: 600 }}>Connexion</h1>
        <p style={{ marginBottom: 24, color: '#6b7280', fontSize: 14 }}>
          Restaurant Le 8e Continent / Saveurs d&apos;Ailleurs
        </p>
        {errorMessage && (
          <div
            role="alert"
            style={{ marginBottom: 16, padding: 12, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626', fontSize: 14 }}
          >
            {errorMessage}
          </div>
        )}
        <form action={loginAction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="submit"
            style={{ padding: '10px 16px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          >
            Se connecter
          </button>
        </form>
      </div>
    </main>
  );
}

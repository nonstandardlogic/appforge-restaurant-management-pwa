'use client';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { startTransition, useState } from 'react';

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function switchLocale(next: 'fr' | 'en') {
    if (next === locale || pending) return;
    setPending(true);
    await fetch('/api/user/locale', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: next }),
    });
    setPending(false);
    // router.refresh() re-renders Server Components without a full page reload.
    // The layout re-reads the locale cookie set by the API response and passes
    // the new messages to NextIntlClientProvider.
    startTransition(() => router.refresh());
  }

  const base =
    'px-3 py-1 text-sm font-medium border transition-colors ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ' +
    'disabled:cursor-not-allowed disabled:opacity-60';
  const active = 'bg-blue-700 text-white border-blue-700';
  const inactive = 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';

  return (
    <div
      role="group"
      aria-label="Sélection de la langue / Language selection"
      className="inline-flex"
    >
      <button
        type="button"
        onClick={() => switchLocale('fr')}
        disabled={pending}
        aria-pressed={locale === 'fr'}
        aria-label="Passer en français"
        className={`${base} rounded-l-md ${locale === 'fr' ? active : inactive}`}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => switchLocale('en')}
        disabled={pending}
        aria-pressed={locale === 'en'}
        aria-label="Switch to English"
        className={`${base} rounded-r-md border-l-0 ${locale === 'en' ? active : inactive}`}
      >
        EN
      </button>
    </div>
  );
}

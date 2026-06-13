import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { cookies } from 'next/headers';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | 8e Continent',
    default: 'Restaurant Management PWA',
  },
  description: "Le 8e Continent / Saveurs d'Ailleurs — Management PWA",
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '8e Continent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1d4ed8',
};

type Locale = 'fr' | 'en';

async function loadMessages(locale: Locale) {
  return locale === 'en'
    ? (await import('../messages/en.json')).default
    : (await import('../messages/fr.json')).default;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const locale: Locale = cookieStore.get('locale')?.value === 'en' ? 'en' : 'fr';
  const messages = await loadMessages(locale);

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Restaurant Management PWA',
  description: "Le 8e Continent / Saveurs d'Ailleurs — Management PWA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

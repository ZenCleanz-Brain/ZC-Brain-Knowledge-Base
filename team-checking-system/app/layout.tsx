import './globals.css';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { AuthProvider } from './providers';
import { Analytics } from '@vercel/analytics/next';

// ZenCleanz Brand Font - Area Variable (primary typeface)
const areaFont = localFont({
  src: '../public/fonts/Area-Variable-wght-wdth-slnt-inkt.ttf',
  variable: '--font-area',
  display: 'swap',
  weight: '100 900',
});

// Cambon Light Italic (secondary typeface for accent text)
const cambonFont = localFont({
  src: '../public/fonts/Cambon-LightItalic.otf',
  variable: '--font-cambon',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ZenCleanz Knowledge Base Portal',
  description: 'Team collaboration portal for managing knowledge base documents',
  icons: {
    icon: '/zencleanz-logo.png',
    apple: '/zencleanz-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" className={`${areaFont.variable} ${cambonFont.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

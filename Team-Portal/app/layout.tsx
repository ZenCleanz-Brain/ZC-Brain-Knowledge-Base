import './globals.css';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Alegreya_Sans } from 'next/font/google';
import { AuthProvider } from './providers';
import { Analytics } from '@vercel/analytics/next';

// Alegreya Sans from Google Fonts (primary typeface)
const alegreyaSans = Alegreya_Sans({
  subsets: ['latin'],
  variable: '--font-alegreya-sans',
  display: 'swap',
  weight: ['100', '300', '400', '500', '700', '800', '900'],
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
    <html lang="en" data-theme="dark" className={`${alegreyaSans.variable} ${cambonFont.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import { Providers } from './providers';
import { validateGeneralAppEnv } from '../lib/env';
import './globals.css';

validateGeneralAppEnv();

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ChronoGlobe',
  description: 'Real-time and historical intelligence platform for global events.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();

  if (
    process.env.NODE_ENV !== 'production' &&
    requestHeaders.get('x-debug-global-error') === '1'
  ) {
    throw new Error('Forced global app error boundary event for Sentry verification.');
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-950 text-slate-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0FA958',
};

export const metadata: Metadata = {
  title: 'AfriLaunch Hub — Where Ideas Become Real Businesses',
  description: 'We help entrepreneurs turn ideas into websites, apps, and scalable startups — with tech, guidance, marketing, and investor access.',
  icons: { icon: '/favicon.ico' },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased font-sans">{children}</body>
    </html>
  );
}

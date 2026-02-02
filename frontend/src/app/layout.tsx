import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AfriLaunch Hub — From Idea to Impact',
  description: 'Help African entrepreneurs turn ideas into websites, apps, and businesses.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

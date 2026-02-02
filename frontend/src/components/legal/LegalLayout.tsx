import Link from 'next/link';
import { Nav, Footer } from '@/components/landing';

interface LegalLayoutProps {
  title: string;
  description: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalLayout({ title, description, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-text-dark">
      <Nav />
      <main className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <Link
            href="/"
            className="inline-flex text-sm font-medium text-gray-500 hover:text-primary transition mb-6"
          >
            ← Back to home
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-secondary sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-gray-600">{description}</p>
          <p className="mt-1 text-sm text-gray-500">Last updated: {lastUpdated}</p>
          <div className="mt-10 space-y-8 text-gray-700 leading-relaxed [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-secondary [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-secondary [&_p]:my-3 [&_ul]:my-4 [&_li]:my-1 [&_li]:ml-4">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

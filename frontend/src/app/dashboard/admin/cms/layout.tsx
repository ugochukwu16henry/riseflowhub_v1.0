'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cmsSectionSlugs, cmsSections } from '@/lib/cmsSections';

export default function CMSLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-1">CMS Manager</h1>
      <p className="text-gray-600 mb-6">Edit all dynamic content. Only Super Admin can access.</p>
      <div className="flex gap-6">
        <aside className="w-52 flex-shrink-0">
          <nav className="rounded-xl border border-gray-200 bg-white p-2">
            <Link
              href="/dashboard/admin/cms"
              className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                pathname === '/dashboard/admin/cms' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Overview
            </Link>
            {cmsSectionSlugs.map((slug) => {
              const section = cmsSections[slug];
              const href = `/dashboard/admin/cms/${slug}`;
              const active = pathname === href;
              return (
                <Link
                  key={slug}
                  href={href}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                    active ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {section?.title ?? slug}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { cmsSections, cmsSectionSlugs } from '@/lib/cmsSections';

export default function CMSPage() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="font-semibold text-secondary mb-2">Content sections</h2>
      <p className="text-gray-600 text-sm mb-6">
        Select a section to edit. Changes are saved to the CMS and reflected across the platform after cache refresh.
      </p>
      <ul className="space-y-2">
        {cmsSectionSlugs.map((slug) => {
          const section = cmsSections[slug];
          return (
            <li key={slug}>
              <Link
                href={`/dashboard/admin/cms/${slug}`}
                className="block rounded-lg border border-gray-100 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 hover:border-gray-200"
              >
                <span className="text-primary">{section?.title ?? slug}</span>
                {section?.description && (
                  <span className="block text-gray-500 font-normal mt-0.5">{section.description}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

'use client';

import Link from 'next/link';

export default function AdminAnalyticsPage() {
  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Analytics</h1>
      <p className="text-gray-600 mb-6">Platform and marketing analytics.</p>
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center text-gray-500">
        <p className="mb-4">Analytics are available per project in Marketing, and platform-wide in Reports.</p>
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard/marketing" className="text-primary font-medium hover:underline">
            Marketing →
          </Link>
          <Link href="/dashboard/admin/reports" className="text-primary font-medium hover:underline">
            Reports →
          </Link>
        </div>
      </div>
    </div>
  );
}

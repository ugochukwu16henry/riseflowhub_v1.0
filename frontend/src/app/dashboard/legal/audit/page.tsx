'use client';

import Link from 'next/link';

export default function LegalAuditPage() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Audit trail</h1>
      <p className="text-gray-600 mb-4">Full audit trail for agreements and signing events is available in the main Agreements view and via Super Admin audit logs.</p>
      <Link href="/dashboard/legal" className="text-primary font-medium hover:underline">← Agreements</Link>
    </div>
  );
}

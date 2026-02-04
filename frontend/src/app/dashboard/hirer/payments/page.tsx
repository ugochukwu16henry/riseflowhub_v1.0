'use client';

import Link from 'next/link';

export default function HirerPaymentsPage() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Payments</h1>
      <p className="text-gray-600 mb-4">Platform fee and payment history. Pay the one-time $20 fee from the dashboard if you haven’t yet.</p>
      <Link href="/dashboard/hirer" className="text-primary font-medium hover:underline">← Dashboard</Link>
    </div>
  );
}

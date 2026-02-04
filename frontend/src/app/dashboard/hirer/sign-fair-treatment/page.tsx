'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getStoredToken, api } from '@/lib/api';

export default function HirerSignFairTreatmentPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSign() {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    try {
      await api.hirer.signFairTreatment(token);
      setDone(true);
    } catch (e) {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="p-6 max-w-md">
        <p className="text-green-600 font-medium">Fair Treatment Agreement recorded.</p>
        <Link href="/dashboard/hirer" className="mt-2 inline-block text-primary hover:underline">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Fair Treatment Agreement</h1>
      <p className="text-gray-600 mb-4">By signing you agree to treat talent fairly, pay on time, and follow platform guidelines. (This is a placeholder — in production you’d review and sign the full document.)</p>
      <button onClick={handleSign} disabled={loading} className="rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90 disabled:opacity-50">I agree / Sign</button>
      <Link href="/dashboard/hirer" className="ml-3 text-gray-600 hover:underline">Cancel</Link>
    </div>
  );
}

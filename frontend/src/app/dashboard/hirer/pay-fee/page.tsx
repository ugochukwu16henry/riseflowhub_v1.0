'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getStoredToken, api } from '@/lib/api';

export default function HirerPayFeePage() {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    try {
      const r = await api.marketplaceFee.createSession({ type: 'hirer_platform_fee' }, token);
      if ((r as { alreadyPaid?: boolean }).alreadyPaid) {
        window.location.href = '/dashboard/hirer';
        return;
      }
      window.location.href = (r as { checkoutUrl: string }).checkoutUrl;
    } catch (e) {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Hirer platform fee</h1>
      <p className="text-gray-600 mb-4">One-time $20 fee to hire talent on the platform. You must also sign the Fair Treatment Agreement. Simulated payment.</p>
      <button onClick={handlePay} disabled={loading} className="rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90 disabled:opacity-50">Pay $20</button>
      <Link href="/dashboard/hirer" className="ml-3 text-gray-600 hover:underline">Cancel</Link>
    </div>
  );
}

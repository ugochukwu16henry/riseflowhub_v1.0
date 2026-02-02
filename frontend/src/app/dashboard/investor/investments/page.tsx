'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredToken, api } from '@/lib/api';
import type { InvestmentListItem } from '@/lib/api';

export default function MyInvestmentsPage() {
  const [investments, setInvestments] = useState<InvestmentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.investments
      .list(token)
      .then(setInvestments)
      .catch(() => setInvestments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">My investments</h1>
      <p className="text-gray-600 mb-6">
        Track your expressed interest, meeting requests, and commitments.
      </p>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : investments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center text-gray-500">
          No investments yet. Browse the marketplace to express interest or commit.
          <Link href="/dashboard/investor/marketplace" className="mt-3 block text-primary hover:underline">
            Go to Marketplace →
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Startup</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Equity</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-text-dark">
                    {inv.startup?.project?.projectName ?? inv.startupId}
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">{inv.status.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {inv.amount != null ? Number(inv.amount).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {inv.equityPercent != null ? `${inv.equityPercent}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/investor/startups/${inv.startupId}`}
                      className="text-primary hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

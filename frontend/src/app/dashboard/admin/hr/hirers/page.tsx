'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type HirerListItem } from '@/lib/api';

export default function HRHirersPage() {
  const [items, setItems] = useState<HirerListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.hirer.list(token).then((r) => setItems(r.items)).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Hirers</h1>
      {loading ? <p className="text-gray-500">Loading...</p> : items.length === 0 ? <p className="text-gray-500">No hirers.</p> : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fee / Fair Treatment</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((h) => (
                <tr key={h.id}>
                  <td className="px-4 py-3 text-sm font-medium">{h.companyName}</td>
                  <td className="px-4 py-3 text-sm">{h.user.name} — {h.user.email}</td>
                  <td className="px-4 py-3 text-sm">{h.feePaid ? '✓' : '—'} / {h.fairTreatmentSignedAt ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

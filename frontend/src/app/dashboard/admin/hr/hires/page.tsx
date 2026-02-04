'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type HireListItem } from '@/lib/api';

export default function HRHiresPage() {
  const [items, setItems] = useState<HireListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.hiring.listHires(token).then((r) => setItems(r.items)).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All hires</h1>
      {loading ? <p className="text-gray-500">Loading...</p> : items.length === 0 ? <p className="text-gray-500">No hires.</p> : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Talent</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hirer</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((h) => (
                <tr key={h.id}>
                  <td className="px-4 py-3 text-sm">{h.projectTitle}</td>
                  <td className="px-4 py-3 text-sm">{h.talent?.name}</td>
                  <td className="px-4 py-3 text-sm">{h.hirer?.name}</td>
                  <td className="px-4 py-3 text-sm">{h.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

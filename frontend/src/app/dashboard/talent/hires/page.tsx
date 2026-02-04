'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredToken, api, type HireListItem } from '@/lib/api';

export default function TalentHiresPage() {
  const [items, setItems] = useState<HireListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.hiring.listHires(token).then((r) => setItems(r.items)).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My hires</h1>
      {loading ? <p className="text-gray-500">Loading...</p> : items.length === 0 ? <p className="text-gray-500">No hire requests yet.</p> : (
        <ul className="space-y-3">
          {items.map((h) => (
            <li key={h.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="font-medium">{h.projectTitle}</div>
              <div className="text-sm text-gray-600">From {h.hirer?.name} · {h.status}</div>
              <div className="mt-2 flex gap-2">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{h.status}</span>
                {h.agreement && <Link href="/dashboard/talent/agreements" className="text-sm text-primary hover:underline">View agreement</Link>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

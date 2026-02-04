'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredToken, api } from '@/lib/api';

export default function HirerAgreementsPage() {
  const [list, setList] = useState<{ id: string; title: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.agreements.listAssignedToMe(token).then((r) => setList(Array.isArray(r) ? r.map((a: { id: string; agreement?: { title: string }; status: string }) => ({ id: a.id, title: a.agreement?.title ?? 'Agreement', status: a.status })) : [])).catch(() => setList([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Agreements</h1>
      {loading ? <p className="text-gray-500">Loading...</p> : list.length === 0 ? <p className="text-gray-500">No agreements assigned.</p> : (
        <ul className="space-y-2">
          {list.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
              <span>{a.title} — {a.status}</span>
              <Link href={`/dashboard/agreements/${a.id}`} className="text-sm text-primary hover:underline">View</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

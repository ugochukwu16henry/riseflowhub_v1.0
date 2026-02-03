'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type SuperAdminConsultationRow } from '@/lib/api';

export default function AdminConsultationsPage() {
  const [list, setList] = useState<SuperAdminConsultationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.superAdmin
      .consultations(token)
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Consultations</h1>
      <p className="text-gray-600 mb-6">All consultation bookings (Super Admin only).</p>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Country</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Stage / Goal</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Preferred</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No consultations yet
                    </td>
                  </tr>
                ) : (
                  list.map((c) => (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-text-dark">{c.fullName}</td>
                      <td className="px-4 py-3 text-gray-600">{c.email}</td>
                      <td className="px-4 py-3 text-gray-600">{c.country ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {[c.stage, c.mainGoal].filter(Boolean).join(' / ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {c.preferredContactMethod ?? '—'}
                        {c.preferredTime ? ` ${c.preferredTime}` : ''}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {c.createdAt ? new Date(c.createdAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

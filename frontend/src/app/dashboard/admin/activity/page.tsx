'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type SuperAdminActivityItem } from '@/lib/api';

export default function SuperAdminActivityPage() {
  const [items, setItems] = useState<SuperAdminActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionType, setActionType] = useState<string>('');

  function load() {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    api.superAdmin
      .activity(token, actionType ? { actionType, limit: 200 } : { limit: 200 })
      .then((data) => setItems(data.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [actionType]);

  const actionLabels: Record<string, string> = {
    login: 'Logged in',
    idea_submitted: 'Submitted idea',
    setup_skipped: 'Skipped setup payment',
    setup_paid: 'Paid setup fee',
    agreement_signed: 'Signed agreement',
    agreement_viewed: 'Viewed agreement',
    consultation_booked: 'Booked consultation',
    investor_interest: 'Investor interest',
    payment_completed: 'Payment completed',
    project_created: 'Project created',
    startup_published: 'Startup published',
  };

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">User Activity</h1>
      <p className="text-gray-600 mb-6">
        Who logged in, submitted ideas, skipped payment, signed agreements, booked consultations, and investor interest.
      </p>

      <div className="flex flex-wrap gap-4 mb-6">
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Action</span>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            {Object.entries(actionLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Entity</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No activity yet. Activity is recorded when users log in, submit ideas, sign agreements, etc.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-secondary">
                        {actionLabels[item.actionType] ?? item.actionType}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.userName || item.userEmail || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.entityType}
                        {item.entityId ? ` #${item.entityId.slice(0, 8)}` : ''}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(item.timestamp).toLocaleString()}
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

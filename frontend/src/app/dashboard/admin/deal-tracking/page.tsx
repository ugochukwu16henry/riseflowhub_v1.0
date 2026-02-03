'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api } from '@/lib/api';
import type { DealRoomAdminDeal } from '@/lib/api';

const STATUS_OPTIONS = [
  { value: 'expressed', label: 'Interested' },
  { value: 'meeting_requested', label: 'Meeting requested' },
  { value: 'committed', label: 'Committed' },
  { value: 'due_diligence', label: 'Due diligence' },
  { value: 'agreement_signed', label: 'Agreement signed' },
  { value: 'completed', label: 'Completed' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export default function AdminDealTrackingPage() {
  const token = getStoredToken();
  const [deals, setDeals] = useState<DealRoomAdminDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.dealRoom
      .adminDeals(token)
      .then(setDeals)
      .catch((e) => {
        setError(e.message ?? 'Failed to load deals');
        setDeals([]);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function updateStatus(dealId: string, status: string) {
    if (!token) return;
    setUpdatingId(dealId);
    setError('');
    try {
      await api.investments.updateStatus(dealId, { status }, token);
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, status, interestLevel: statusToInterestLevel(status) } : d))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setUpdatingId(null);
    }
  }

  function statusToInterestLevel(status: string): string {
    if (status === 'expressed') return 'Interested';
    if (status === 'meeting_requested') return 'Meeting';
    if (['committed', 'due_diligence', 'agreement_signed'].includes(status)) return 'Due Diligence';
    return status;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-secondary mb-2">Deal Tracking</h1>
      <p className="text-gray-600 mb-6">
        Monitor which investors viewed which startup, interest level, and deal status. Update status as deals progress.
      </p>

      {error && (
        <div className="rounded-lg bg-amber-50 text-amber-800 px-4 py-3 mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-amber-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : deals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center text-gray-500">
          No deals yet. When investors express interest or request meetings, they will appear here.
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Startup</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Investor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Firm</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Interest level</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Viewed at</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Meeting requested</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Amount / Equity</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d) => (
                  <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-secondary">{d.startupName ?? d.startupId}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{d.investorName}</p>
                      <p className="text-gray-500 text-xs">{d.investorEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{d.firmName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`capitalize px-2 py-0.5 rounded text-xs font-medium ${
                          d.interestLevel === 'Due Diligence'
                            ? 'bg-green-100 text-green-800'
                            : d.interestLevel === 'Meeting'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {d.interestLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-700">{d.status.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {d.viewedAt ? new Date(d.viewedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {d.meetingRequestedAt ? new Date(d.meetingRequestedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {d.amount != null ? `${Number(d.amount).toLocaleString()}` : '—'}
                      {d.equityPercent != null ? ` / ${Number(d.equityPercent)}%` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={d.status}
                        onChange={(e) => updateStatus(d.id, e.target.value)}
                        disabled={updatingId === d.id}
                        className="rounded border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-700 bg-white"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {updatingId === d.id && <span className="ml-1 text-xs text-gray-500">Updating...</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

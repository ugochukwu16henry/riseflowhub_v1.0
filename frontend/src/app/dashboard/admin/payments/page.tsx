'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type SuperAdminPaymentRow } from '@/lib/api';

export default function SuperAdminPaymentsPage() {
  const [rows, setRows] = useState<SuperAdminPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('');
  const [paymentType, setPaymentType] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  function load() {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    const params: { period?: string; paymentType?: string; userId?: string } = {};
    if (period) params.period = period;
    if (paymentType) params.paymentType = paymentType;
    if (userId) params.userId = userId;
    api.superAdmin
      .payments(token, params)
      .then((data) => {
        if (typeof data === 'object' && data && 'rows' in data) setRows(data.rows);
        else setRows([]);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [period, paymentType, userId]);

  async function exportCsv() {
    const token = getStoredToken();
    if (!token) return;
    const q = new URLSearchParams();
    if (period) q.set('period', period);
    if (paymentType) q.set('paymentType', paymentType);
    if (userId) q.set('userId', userId);
    q.set('format', 'csv');
    const base = typeof window === 'undefined' ? process.env.NEXT_PUBLIC_API_URL || '' : '';
    const res = await fetch(`${base}/api/v1/super-admin/payments?${q.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payments-audit.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Payments Audit</h1>
      <p className="text-gray-600 mb-6">
        All platform payments with filters. Export to CSV or view data for PDF.
      </p>

      <div className="flex flex-wrap gap-4 mb-6">
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Period</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Payment type</span>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="setup_fee">Setup Fee</option>
            <option value="consultation">Consultation</option>
            <option value="milestone">Milestone</option>
            <option value="subscription">Subscription</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">User ID</span>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Filter by user ID"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm w-48"
          />
        </label>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Export CSV
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">User Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Payment Type</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Currency</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Converted USD</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-text-dark">{r.userName}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{r.role.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-gray-600">{r.paymentType}</td>
                      <td className="px-4 py-3 text-right">{r.amount}</td>
                      <td className="px-4 py-3 text-gray-600">{r.currency}</td>
                      <td className="px-4 py-3 text-right font-medium">${r.convertedUsd.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-600">{r.status}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(r.date).toLocaleString()}</td>
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

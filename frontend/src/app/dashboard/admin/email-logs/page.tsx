'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type EmailLogRow } from '@/lib/api';

export default function SuperAdminEmailLogsPage() {
  const [data, setData] = useState<{
    rows: EmailLogRow[];
    total: number;
    page: number;
    limit: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [toEmail, setToEmail] = useState<string>('');
  const [resending, setResending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    const params: { page?: number; limit?: number; status?: string; type?: string; toEmail?: string } = {
      page,
      limit: 20,
    };
    if (status) params.status = status;
    if (type) params.type = type;
    if (toEmail.trim()) params.toEmail = toEmail.trim();
    api.superAdmin.emailLogs
      .list(token, params)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [page, status, type, toEmail]);

  async function handleResend(id: string) {
    const token = getStoredToken();
    if (!token) return;
    setResending(id);
    setError(null);
    try {
      await api.superAdmin.emailLogs.resend(id, token);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resend');
    } finally {
      setResending(null);
    }
  }

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Email Logs</h1>
      <p className="text-gray-600 mb-6">
        View all sent emails and resend failed or past emails (Super Admin only).
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-6">
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Status</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Type</span>
          <input
            type="text"
            placeholder="e.g. payment_confirmation"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm w-48"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">To email</span>
          <input
            type="text"
            placeholder="Filter by recipient"
            value={toEmail}
            onChange={(e) => {
              setToEmail(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm w-48"
          />
        </label>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No email logs found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">To</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Subject</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{r.type}</td>
                      <td className="px-4 py-3 text-gray-700">{r.toEmail}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs truncate" title={r.subject}>
                        {r.subject}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            r.status === 'sent'
                              ? 'bg-green-100 text-green-800'
                              : r.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status}
                        </span>
                        {r.errorMessage && (
                          <span className="block text-xs text-red-600 mt-0.5 truncate max-w-[12rem]" title={r.errorMessage}>
                            {r.errorMessage}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleResend(r.id)}
                          disabled={resending === r.id}
                          className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                        >
                          {resending === r.id ? 'Sending…' : 'Resend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Page {page} of {totalPages} ({total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

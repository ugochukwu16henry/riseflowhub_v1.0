'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type LegalAgreementsResponse } from '@/lib/api';

const AGREEMENT_TYPES = ['NDA', 'MOU', 'CoFounder', 'Terms', 'FairTreatment', 'HireContract', 'Partnership', 'Investor'];

export default function LegalDashboardPage() {
  const [data, setData] = useState<LegalAgreementsResponse | null>(null);
  const [disputes, setDisputes] = useState<{ items: unknown[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [documentStatusFilter, setDocumentStatusFilter] = useState('');
  const [exportingId, setExportingId] = useState<string | null>(null);

  function load() {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    const params: { type?: string; status?: string; documentStatus?: string } = {};
    if (typeFilter) params.type = typeFilter;
    if (statusFilter) params.status = statusFilter;
    if (documentStatusFilter) params.documentStatus = documentStatusFilter;
    Promise.all([
      api.legal.agreements(token, params).then(setData).catch(() => setData(null)),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/legal/disputes`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : { items: [] })
        .then(setDisputes)
        .catch(() => setDisputes({ items: [] })),
    ]).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [typeFilter, statusFilter, documentStatusFilter]);

  async function handleExport(agreementId: string) {
    const token = getStoredToken();
    if (!token) return;
    setExportingId(agreementId);
    try {
      await api.agreements.exportDownload(agreementId, token);
    } catch {
      // ignore
    } finally {
      setExportingId(null);
    }
  }

  if (loading) {
    return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;
  }

  const disputeList = (disputes?.items ?? []) as Array<{
    id: string;
    agreement?: { title: string; type: string };
    user?: { name: string; email: string };
    status: string;
    createdAt: string;
  }>;

  const assignments = (data?.assignments ?? []) as Array<{
    id: string;
    agreementId: string;
    agreement: { id: string; title: string; type: string; status?: string; version?: number };
    user: { id: string; name: string; email: string };
    role?: string;
    status: string;
    signedAt: string | null;
    ipAddress?: string | null;
    deviceInfo?: string | null;
    createdAt: string;
  }>;
  const hireContracts = (data?.hireContracts ?? []) as Array<{
    hireId: string;
    agreementId: string | null;
    agreement: { id: string; title: string; type: string } | null;
    projectTitle: string;
    talent: { id: string; name: string; email: string };
    hirer: { id: string; name: string; email: string };
    status: string;
    createdAt: string;
  }>;

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Legal — Agreements</h1>
      <p className="text-gray-600 mb-6">View all agreements, filter by type/status, download signed document (HTML for Print to PDF), and audit signature logs.</p>

      <div className="flex flex-wrap gap-4 mb-6">
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Type</span>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">
            <option value="">All</option>
            {AGREEMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Signer status</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="Signed">Signed</option>
            <option value="Overdue">Overdue</option>
            <option value="Disputed">Disputed</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Document status</span>
          <select value={documentStatusFilter} onChange={(e) => setDocumentStatusFilter(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </label>
      </div>

      {disputeList.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-amber-800 mb-3">Disputes</h2>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 overflow-hidden">
            <table className="min-w-full divide-y divide-amber-200">
              <thead className="bg-amber-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-amber-900 uppercase">Agreement</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-amber-900 uppercase">Party</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-amber-900 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-amber-100">
                {disputeList.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3 text-sm">{d.agreement?.title} ({d.agreement?.type})</td>
                    <td className="px-4 py-3 text-sm">{d.user?.name} — {d.user?.email}</td>
                    <td className="px-4 py-3 text-sm font-medium text-amber-700">{d.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Assigned agreements</h2>
        {assignments.length === 0 ? (
          <p className="text-gray-500">No assigned agreements.</p>
        ) : (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Agreement</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Party / Role</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Signed</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 text-sm">
                      {a.agreement?.title} ({a.agreement?.type})
                      {a.agreement?.status != null && (
                        <span className="ml-1 text-xs text-gray-500">— {a.agreement.status}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{a.user?.name} — {a.user?.email}{a.role ? ` (${a.role})` : ''}</td>
                    <td className="px-4 py-3 text-sm">{a.status}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{a.signedAt ? new Date(a.signedAt).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={() => handleExport(a.agreementId)}
                        disabled={exportingId === a.agreementId}
                        className="text-primary hover:underline disabled:opacity-50"
                      >
                        {exportingId === a.agreementId ? 'Exporting…' : 'Download HTML'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Hire contracts</h2>
        {hireContracts.length === 0 ? (
          <p className="text-gray-500">No hire contracts.</p>
        ) : (
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
                {hireContracts.map((h) => (
                  <tr key={h.hireId}>
                    <td className="px-4 py-3 text-sm">{h.projectTitle}</td>
                    <td className="px-4 py-3 text-sm">{h.talent?.name} — {h.talent?.email}</td>
                    <td className="px-4 py-3 text-sm">{h.hirer?.name} — {h.hirer?.email}</td>
                    <td className="px-4 py-3 text-sm">{h.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

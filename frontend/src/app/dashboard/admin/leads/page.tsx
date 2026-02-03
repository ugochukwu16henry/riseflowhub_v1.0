'use client';

import { useEffect, useState, useCallback } from 'react';
import { getStoredToken, api, type AdminLeadRow, type AdminLeadDetail, type AdminLeadStatus, type User } from '@/lib/api';

const STATUSES: AdminLeadStatus[] = ['New', 'Contacted', 'ProposalSent', 'Converted', 'Closed'];

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<AdminLeadRow[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLead, setDetailLead] = useState<AdminLeadDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', country: '', ideaSummary: '', stage: '', goal: '', budget: '' });

  const token = typeof window !== 'undefined' ? getStoredToken() : null;

  const fetchLeads = useCallback(() => {
    if (!token) return;
    const params = statusFilter ? { status: statusFilter } : undefined;
    api.admin.leads.list(token, params)
      .then(setLeads)
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [token, statusFilter]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchLeads();
  }, [token, fetchLeads]);

  useEffect(() => {
    if (!token) return;
    api.users.list(token).then(setUsers).catch(() => setUsers([]));
  }, [token]);

  function openDetail(id: string) {
    if (!token) return;
    setShowDetailModal(true);
    setDetailLoading(true);
    setDetailLead(null);
    api.admin.leads.get(id, token)
      .then(setDetailLead)
      .catch(() => setDetailLead(null))
      .finally(() => setDetailLoading(false));
  }

  function closeDetail() {
    setShowDetailModal(false);
    setDetailLead(null);
    setNoteContent('');
    fetchLeads();
  }

  function handleStatusChange(leadId: string, status: AdminLeadStatus) {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    api.admin.leads.updateStatus(leadId, { status }, token)
      .then((updated) => {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
        if (detailLead?.id === leadId) setDetailLead({ ...detailLead, ...updated });
      })
      .catch((e) => setError(e.message))
      .finally(() => setSubmitting(false));
  }

  function handleAssign(leadId: string, assignedToId: string | null) {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    const value = assignedToId && assignedToId.trim() ? assignedToId : null;
    api.admin.leads.assign(leadId, { assignedToId: value }, token)
      .then((updated) => {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
        if (detailLead?.id === leadId) setDetailLead({ ...detailLead, ...updated });
      })
      .catch((e) => setError(e.message))
      .finally(() => setSubmitting(false));
  }

  function handleAddNote() {
    if (!token || !detailLead || !noteContent.trim()) return;
    setSubmitting(true);
    setError(null);
    api.admin.leads.addNote(detailLead.id, { content: noteContent.trim() }, token)
      .then((note) => {
        setDetailLead((prev) => prev ? { ...prev, notes: [note, ...prev.notes] } : null);
        setNoteContent('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setSubmitting(false));
  }

  function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    api.admin.leads.create(
      {
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        country: addForm.country.trim() || undefined,
        ideaSummary: addForm.ideaSummary.trim() || undefined,
        stage: addForm.stage.trim() || undefined,
        goal: addForm.goal.trim() || undefined,
        budget: addForm.budget.trim() || undefined,
      },
      token
    )
      .then((created) => {
        setLeads((prev) => [created, ...prev]);
        setShowAddModal(false);
        setAddForm({ name: '', email: '', country: '', ideaSummary: '', stage: '', goal: '', budget: '' });
      })
      .catch((e) => setError(e.message))
      .finally(() => setSubmitting(false));
  }

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-secondary">Leads</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Add lead
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white text-gray-700"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/([A-Z])/g, ' $1').trim()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

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
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Budget</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Assigned</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      No leads yet. Add a lead or sync from consultations.
                    </td>
                  </tr>
                ) : (
                  leads.map((l) => (
                    <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-text-dark">{l.name}</td>
                      <td className="px-4 py-3 text-gray-600">{l.email}</td>
                      <td className="px-4 py-3 text-gray-600">{l.country ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {[l.stage, l.goal].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{l.budget ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            l.status === 'Converted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : l.status === 'Closed'
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {l.status.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{l.assignedTo?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(l.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openDetail(l.id)}
                            className="text-primary font-medium hover:underline"
                          >
                            View
                          </button>
                          <select
                            value={l.assignedToId ?? ''}
                            onChange={(e) => handleAssign(l.id, e.target.value || null)}
                            disabled={submitting}
                            className="rounded border border-gray-200 px-2 py-1 text-xs bg-white"
                          >
                            <option value="">Unassigned</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                          <select
                            value={l.status}
                            onChange={(e) => handleStatusChange(l.id, e.target.value as AdminLeadStatus)}
                            disabled={submitting}
                            className="rounded border border-gray-200 px-2 py-1 text-xs bg-white"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s.replace(/([A-Z])/g, ' $1').trim()}
                              </option>
                            ))}
                          </select>
                          {l.status !== 'Converted' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(l.id, 'Converted')}
                              disabled={submitting}
                              className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Convert
                            </button>
                          )}
                          {l.projectId && (
                            <a
                              href={`/dashboard/admin/projects/${l.project?.id ?? l.projectId}`}
                              className="text-primary font-medium hover:underline text-xs"
                            >
                              Project
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal: idea details + notes */}
      {showDetailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !detailLoading && closeDetail()}
          role="dialog"
          aria-modal="true"
          aria-label="Lead details"
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary">
                {detailLoading ? 'Loading...' : detailLead ? detailLead.name : 'Lead details'}
              </h2>
              <button
                type="button"
                onClick={closeDetail}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading && (
                <p className="text-gray-500">Loading...</p>
              )}
              {!detailLoading && detailLead && (
                <>
                  <section>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Contact</h3>
                    <p className="text-text-dark">{detailLead.email}</p>
                    {detailLead.country && <p className="text-gray-600">{detailLead.country}</p>}
                  </section>
                  <section>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Idea summary</h3>
                    <p className="text-text-dark whitespace-pre-wrap">
                      {detailLead.ideaSummary || '—'}
                    </p>
                  </section>
                  <section className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Stage</span>
                      <p className="font-medium">{detailLead.stage ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Goal</span>
                      <p className="font-medium">{detailLead.goal ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Budget</span>
                      <p className="font-medium">{detailLead.budget ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Status</span>
                      <p className="font-medium">{detailLead.status}</p>
                    </div>
                    {detailLead.project && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Project</span>
                        <p className="font-medium">
                          <a
                            href={`/dashboard/admin/projects/${detailLead.project.id}`}
                            className="text-primary hover:underline"
                          >
                            {detailLead.project.projectName}
                          </a>
                        </p>
                      </div>
                    )}
                  </section>
                  <section>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                    <div className="space-y-3">
                      {detailLead.notes?.length === 0 ? (
                        <p className="text-gray-500 text-sm">No notes yet.</p>
                      ) : (
                        detailLead.notes?.map((n) => (
                          <div
                            key={n.id}
                            className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 text-sm"
                          >
                            <p className="text-text-dark whitespace-pre-wrap">{n.content}</p>
                            <p className="text-gray-400 text-xs mt-1">
                              {n.createdBy?.name ?? 'System'} · {new Date(n.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                      <div className="flex gap-2">
                        <textarea
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="Add a note..."
                          rows={2}
                          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleAddNote}
                          disabled={!noteContent.trim() || submitting}
                          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add lead modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !submitting && setShowAddModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Add lead"
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-secondary mb-4">Add lead</h2>
            <form onSubmit={handleCreateLead} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Name *</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email *</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Country</label>
                <input
                  type="text"
                  value={addForm.country}
                  onChange={(e) => setAddForm((f) => ({ ...f, country: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Idea summary</label>
                <textarea
                  value={addForm.ideaSummary}
                  onChange={(e) => setAddForm((f) => ({ ...f, ideaSummary: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Stage</label>
                  <input
                    type="text"
                    value={addForm.stage}
                    onChange={(e) => setAddForm((f) => ({ ...f, stage: e.target.value }))}
                    placeholder="Idea | MVP | Business"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Goal</label>
                  <input
                    type="text"
                    value={addForm.goal}
                    onChange={(e) => setAddForm((f) => ({ ...f, goal: e.target.value }))}
                    placeholder="Website | App | etc."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Budget</label>
                <input
                  type="text"
                  value={addForm.budget}
                  onChange={(e) => setAddForm((f) => ({ ...f, budget: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

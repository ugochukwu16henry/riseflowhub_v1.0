'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type TenantRow, type Tenant } from '@/lib/api';

const PLAN_TYPES = ['free', 'starter', 'growth', 'enterprise'];

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ orgName: string; domain: string; logo: string; primaryColor: string; planType: string }>({
    orgName: '',
    domain: '',
    logo: '',
    primaryColor: '#6366f1',
    planType: 'free',
  });
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ orgName: '', domain: '', logo: '', primaryColor: '#6366f1', planType: 'free' });

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.tenants
      .list(token)
      .then(setTenants)
      .catch(() => setError('Failed to load tenants'))
      .finally(() => setLoading(false));
  }, []);

  function startEdit(t: TenantRow) {
    setEditingId(t.id);
    setEditForm({
      orgName: t.orgName,
      domain: t.domain || '',
      logo: t.logo || '',
      primaryColor: t.primaryColor || '#6366f1',
      planType: t.planType,
    });
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const token = getStoredToken();
    if (!token) return;
    setError(null);
    setSuccess(null);
    api.tenants
      .update(
        editingId,
        {
          orgName: editForm.orgName,
          domain: editForm.domain || null,
          logo: editForm.logo || null,
          primaryColor: editForm.primaryColor || null,
          planType: editForm.planType,
        },
        token
      )
      .then(() => {
        setSuccess('Tenant updated.');
        setEditingId(null);
        return api.tenants.list(token);
      })
      .then(setTenants)
      .catch((err: Error) => setError(err.message || 'Update failed'));
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const token = getStoredToken();
    if (!token) return;
    setError(null);
    setSuccess(null);
    api.tenants
      .create(
        {
          orgName: createForm.orgName,
          domain: createForm.domain || undefined,
          logo: createForm.logo || undefined,
          primaryColor: createForm.primaryColor || undefined,
          planType: createForm.planType,
        },
        token
      )
      .then(() => {
        setSuccess('Tenant created.');
        setShowCreate(false);
        setCreateForm({ orgName: '', domain: '', logo: '', primaryColor: '#6366f1', planType: 'free' });
        return api.tenants.list(token);
      })
      .then(setTenants)
      .catch((err: Error) => setError(err.message || 'Create failed'));
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Tenants (white-label)</h1>
      <p className="text-gray-600 mb-6">Manage organizations: custom domain, logo, primary color, plan, and billing.</p>

      {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm mb-4">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 text-green-800 px-4 py-2 text-sm mb-4">{success}</div>}

      <div className="mb-6 flex justify-between items-center">
        <span className="text-sm text-gray-500">{tenants.length} tenant(s)</span>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          New tenant
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 p-6 rounded-xl border border-gray-200 bg-white space-y-4">
          <h2 className="text-lg font-semibold text-secondary">Create tenant</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization name *</label>
              <input
                type="text"
                value={createForm.orgName}
                onChange={(e) => setCreateForm((f) => ({ ...f, orgName: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom domain</label>
              <input
                type="text"
                placeholder="app.acme.com"
                value={createForm.domain}
                onChange={(e) => setCreateForm((f) => ({ ...f, domain: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={createForm.logo}
                onChange={(e) => setCreateForm((f) => ({ ...f, logo: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary color</label>
              <input
                type="text"
                placeholder="#6366f1"
                value={createForm.primaryColor}
                onChange={(e) => setCreateForm((f) => ({ ...f, primaryColor: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select
                value={createForm.planType}
                onChange={(e) => setCreateForm((f) => ({ ...f, planType: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {PLAN_TYPES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary/90">Create</button>
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>
      )}

      <ul className="space-y-4">
        {tenants.map((t) => (
          <li key={t.id} className="rounded-xl border border-gray-200 bg-white p-4 flex flex-wrap items-center gap-4">
            {editingId === t.id ? (
              <form onSubmit={handleUpdate} className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Org name</label>
                  <input
                    type="text"
                    value={editForm.orgName}
                    onChange={(e) => setEditForm((f) => ({ ...f, orgName: e.target.value }))}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Domain</label>
                  <input
                    type="text"
                    value={editForm.domain}
                    onChange={(e) => setEditForm((f) => ({ ...f, domain: e.target.value }))}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Logo URL</label>
                  <input
                    type="url"
                    value={editForm.logo}
                    onChange={(e) => setEditForm((f) => ({ ...f, logo: e.target.value }))}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Primary color</label>
                  <input
                    type="text"
                    value={editForm.primaryColor}
                    onChange={(e) => setEditForm((f) => ({ ...f, primaryColor: e.target.value }))}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Plan</label>
                  <select
                    value={editForm.planType}
                    onChange={(e) => setEditForm((f) => ({ ...f, planType: e.target.value }))}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  >
                    {PLAN_TYPES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2 flex gap-2">
                  <button type="submit" className="rounded bg-primary text-white px-3 py-1.5 text-sm">Save</button>
                  <button type="button" onClick={() => setEditingId(null)} className="rounded border border-gray-300 px-3 py-1.5 text-sm">Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  {t.logo ? (
                    <img src={t.logo} alt={t.orgName} className="h-10 w-auto object-contain" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
                      {t.orgName.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-secondary">{t.orgName}</p>
                    <p className="text-xs text-gray-500">{t.domain || 'default'}</p>
                  </div>
                </div>
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: t.primaryColor || '#6366f1' }}
                  title={t.primaryColor || ''}
                />
                <span className="text-sm text-gray-600 capitalize">{t.planType}</span>
                <span className="text-sm text-gray-500">{(t as TenantRow & { userCount?: number }).userCount ?? 0} users</span>
                <button
                  type="button"
                  onClick={() => startEdit(t)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Edit
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

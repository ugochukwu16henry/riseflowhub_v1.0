'use client';

import { useEffect, useState } from 'react';
import {
  getStoredToken,
  api,
  type Project,
  type MarketingAnalytics,
  type CampaignWithLeads,
  type Campaign,
} from '@/lib/api';

const PLATFORMS = ['Meta', 'Google', 'Email'];
const CONVERSION_STATUSES = ['lead', 'qualified', 'converted'];

export default function MarketingPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>('');
  const [analytics, setAnalytics] = useState<MarketingAnalytics | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignWithLeads[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create campaign form
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    platform: 'Meta',
    budget: 1000,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  // Import leads form
  const [importCampaignId, setImportCampaignId] = useState('');
  const [importRows, setImportRows] = useState('');

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.projects
      .list(token)
      .then(setProjects)
      .catch(() => setError('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!projectId) {
      setAnalytics(null);
      setCampaigns([]);
      return;
    }
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    Promise.all([
      api.analytics.get(projectId, token),
      api.campaigns.listByProject(projectId, token),
    ])
      .then(([a, c]) => {
        setAnalytics(a);
        setCampaigns(c);
      })
      .catch(() => setError('Failed to load marketing data'))
      .finally(() => setLoading(false));
  }, [projectId]);

  function fetchSuggestions() {
    if (!projectId) return;
    const token = getStoredToken();
    if (!token) return;
    setLoadingSuggestions(true);
    api.ai
      .marketingSuggestions(
        {
          projectId,
          traffic: analytics?.traffic ?? 0,
          conversions: analytics?.conversions ?? 0,
          cac: analytics?.cac ?? undefined,
          roi: analytics?.roi ?? undefined,
          byPlatform: analytics?.byPlatform ?? {},
        },
        token
      )
      .then((r) => setSuggestions(r.suggestions))
      .catch(() => setSuggestions(['Unable to load suggestions.']))
      .finally(() => setLoadingSuggestions(false));
  }

  function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const token = getStoredToken();
    if (!token || !projectId) return;
    api.campaigns
      .create(
        {
          projectId,
          platform: campaignForm.platform,
          budget: campaignForm.budget,
          startDate: campaignForm.startDate,
          endDate: campaignForm.endDate,
        },
        token
      )
      .then(() => {
        setSuccess('Campaign created.');
        setShowCreateCampaign(false);
        return api.campaigns.listByProject(projectId, token);
      })
      .then(setCampaigns)
      .then(() => api.analytics.get(projectId, token))
      .then(setAnalytics)
      .catch((err: Error) => setError(err.message || 'Failed to create campaign'));
  }

  function handleImportLeads(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!importCampaignId.trim()) {
      setError('Select a campaign.');
      return;
    }
    const lines = importRows.trim().split('\n').filter(Boolean);
    const leads = lines.map((line) => {
      const [source = 'import', costStr = '0', conversionStatus = 'lead'] = line.split(',').map((s) => s.trim());
      return { source, cost: parseFloat(costStr) || 0, conversionStatus };
    });
    if (leads.length === 0) {
      setError('Enter at least one row: source, cost, conversionStatus (e.g. "Meta ad, 5.50, lead").');
      return;
    }
    const token = getStoredToken();
    if (!token) return;
    api.leads
      .import({ campaignId: importCampaignId, leads }, token)
      .then((r) => {
        setSuccess(`Imported ${r.imported} lead(s).`);
        setImportRows('');
        if (projectId) {
          return Promise.all([
            api.campaigns.listByProject(projectId, token),
            api.analytics.get(projectId, token),
          ]).then(([c, a]) => {
            setCampaigns(c);
            setAnalytics(a);
          });
        }
      })
      .catch((err: Error) => setError(err.message || 'Failed to import leads'));
  }

  if (loading && !projectId) {
    return (
      <div className="max-w-5xl">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const project = projects.find((p) => p.id === projectId);
  const funnelMax = analytics?.funnel?.reduce((acc, f) => acc + f.count, 0) || 1;

  return (
    <div className="max-w-5xl space-y-8">
      <h1 className="text-2xl font-bold text-secondary">Marketing Analytics & Campaigns</h1>
      <p className="text-gray-600">
        Track performance across Meta, Google, and Email. View funnel, ROI, and get AI growth suggestions.
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm min-w-[200px]"
        >
          <option value="">Select a project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.projectName}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 text-green-800 px-4 py-2 text-sm" role="alert">
          {success}
        </div>
      )}

      {!projectId && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-500 text-center">
          Select a project to view marketing analytics and campaigns.
        </div>
      )}

      {projectId && loading && (
        <p className="text-gray-500">Loading analytics...</p>
      )}

      {projectId && !loading && analytics && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Traffic</p>
              <p className="text-2xl font-bold text-secondary mt-1">{analytics.traffic}</p>
              <p className="text-xs text-gray-400 mt-0.5">Leads / visits</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Conversions</p>
              <p className="text-2xl font-bold text-primary mt-1">{analytics.conversions}</p>
              <p className="text-xs text-gray-400 mt-0.5">Converted</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">CAC</p>
              <p className="text-2xl font-bold text-secondary mt-1">
                {analytics.cac != null ? `$${analytics.cac.toFixed(2)}` : '—'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Cost per acquisition</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">ROI</p>
              <p className="text-2xl font-bold text-secondary mt-1">
                {analytics.roi != null ? `${analytics.roi.toFixed(1)}%` : '—'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Return on spend</p>
            </div>
          </div>

          {/* Funnel */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-secondary mb-4">Funnel</h2>
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
              {analytics.funnel?.map((stage) => (
                <div key={stage.stage} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t-lg bg-primary/20 border border-primary/40 flex flex-col justify-end min-h-[80px]"
                    style={{
                      height: `${Math.max(20, (stage.count / funnelMax) * 120)}px`,
                    }}
                  >
                    <span className="text-center text-sm font-medium text-primary p-2">{stage.count}</span>
                  </div>
                  <p className="text-xs font-medium text-gray-600 mt-2 capitalize">{stage.stage}</p>
                </div>
              ))}
            </div>
            {(!analytics.funnel || analytics.funnel.length === 0) && (
              <p className="text-gray-500 text-sm">No funnel data yet. Import leads to see the funnel.</p>
            )}
          </div>

          {/* By platform */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-secondary mb-4">By platform</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLATFORMS.map((platform) => {
                const data = analytics.byPlatform?.[platform] ?? { traffic: 0, conversions: 0, cost: 0 };
                return (
                  <div key={platform} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                    <p className="font-medium text-secondary">{platform}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Traffic: {data.traffic} · Conversions: {data.conversions} · Spend: ${data.cost.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI growth suggestions */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-secondary mb-2">AI growth suggestions</h2>
            <button
              type="button"
              onClick={fetchSuggestions}
              disabled={loadingSuggestions}
              className="rounded-lg bg-primary text-white px-3 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {loadingSuggestions ? 'Loading...' : 'Get suggestions'}
            </button>
            {suggestions.length > 0 && (
              <ul className="mt-4 space-y-2 list-disc list-inside text-gray-700 text-sm">
                {suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Campaigns */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-secondary">Campaigns</h2>
              <button
                type="button"
                onClick={() => setShowCreateCampaign(true)}
                className="rounded-lg bg-primary text-white px-3 py-2 text-sm font-medium hover:bg-primary/90"
              >
                New campaign
              </button>
            </div>

            {showCreateCampaign && (
              <form onSubmit={handleCreateCampaign} className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-3">
                <h3 className="font-medium text-secondary">Create campaign</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Platform</label>
                    <select
                      value={campaignForm.platform}
                      onChange={(e) => setCampaignForm((f) => ({ ...f, platform: e.target.value }))}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Budget ($)</label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={campaignForm.budget}
                      onChange={(e) => setCampaignForm((f) => ({ ...f, budget: parseFloat(e.target.value) || 0 }))}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start date</label>
                    <input
                      type="date"
                      value={campaignForm.startDate}
                      onChange={(e) => setCampaignForm((f) => ({ ...f, startDate: e.target.value }))}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End date</label>
                    <input
                      type="date"
                      value={campaignForm.endDate}
                      onChange={(e) => setCampaignForm((f) => ({ ...f, endDate: e.target.value }))}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="rounded-lg bg-primary text-white px-3 py-2 text-sm font-medium hover:bg-primary/90">
                    Create
                  </button>
                  <button type="button" onClick={() => setShowCreateCampaign(false)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <ul className="space-y-3">
              {campaigns.map((c) => (
                <li key={c.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-secondary">{c.platform}</span>
                      <span className="text-gray-500 text-sm ml-2">
                        ${Number(c.budget).toFixed(0)} · {new Date(c.startDate).toLocaleDateString()} – {new Date(c.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{c.leads?.length ?? 0} leads</span>
                  </div>
                </li>
              ))}
            </ul>
            {campaigns.length === 0 && !showCreateCampaign && (
              <p className="text-gray-500 text-sm">No campaigns yet. Create one to start tracking.</p>
            )}
          </div>

          {/* Import leads */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-secondary mb-4">Import leads</h2>
            <form onSubmit={handleImportLeads} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
                <select
                  value={importCampaignId}
                  onChange={(e) => setImportCampaignId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select campaign</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.platform} – ${Number(c.budget).toFixed(0)} ({c.leads?.length ?? 0} leads)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leads (one per line: source, cost, conversionStatus)
                </label>
                <textarea
                  value={importRows}
                  onChange={(e) => setImportRows(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                  placeholder="Meta ad, 5.50, lead&#10;Google search, 12, qualified&#10;Email newsletter, 0.10, converted"
                />
              </div>
              <button type="submit" className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary/90">
                Import
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

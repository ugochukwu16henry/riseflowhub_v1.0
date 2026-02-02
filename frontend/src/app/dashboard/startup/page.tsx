'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type Project, type StartupProfile, type StartupPublishBody } from '@/lib/api';

const STAGES = ['Planning', 'Development', 'Testing', 'Live'];

export default function PublishToMarketplacePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [myProfiles, setMyProfiles] = useState<StartupProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<StartupPublishBody>({
    projectId: '',
    pitchSummary: '',
    tractionMetrics: '',
    fundingNeeded: 0,
    equityOffer: undefined,
    stage: '',
  });

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    Promise.all([api.projects.list(token), api.startups.myProfiles(token)])
      .then(([projList, profileList]) => {
        setProjects(projList);
        setMyProfiles(Array.isArray(profileList) ? profileList : []);
        if (projList.length > 0 && !form.projectId) {
          const first = projList[0];
          const existing = (Array.isArray(profileList) ? profileList : []).find(
            (p: StartupProfile) => p.projectId === first.id
          );
          setForm((f) => ({
            ...f,
            projectId: first.id,
            pitchSummary: existing?.pitchSummary ?? '',
            tractionMetrics: existing?.tractionMetrics ?? '',
            fundingNeeded: existing?.fundingNeeded ?? 0,
            equityOffer: existing?.equityOffer ?? undefined,
            stage: existing?.stage ?? first.stage ?? '',
          }));
        }
      })
      .catch(() => setError('Failed to load projects or profiles'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!form.projectId || myProfiles.length === 0) return;
    const existing = myProfiles.find((p) => p.projectId === form.projectId);
    if (existing) {
      setForm((f) => ({
        ...f,
        pitchSummary: existing.pitchSummary,
        tractionMetrics: existing.tractionMetrics ?? '',
        fundingNeeded: Number(existing.fundingNeeded),
        equityOffer: existing.equityOffer != null ? Number(existing.equityOffer) : undefined,
        stage: existing.stage,
      }));
    }
  }, [form.projectId, myProfiles]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const token = getStoredToken();
    if (!token) return;
    if (!form.projectId || !form.pitchSummary.trim() || form.fundingNeeded < 0) {
      setError('Please fill in project, pitch summary, and funding needed.');
      return;
    }
    setSubmitting(true);
    const body: StartupPublishBody = {
      projectId: form.projectId,
      pitchSummary: form.pitchSummary.trim(),
      fundingNeeded: Number(form.fundingNeeded),
      stage: form.stage || undefined,
    };
    if (form.tractionMetrics?.trim()) body.tractionMetrics = form.tractionMetrics.trim();
    if (form.equityOffer != null && form.equityOffer >= 0) body.equityOffer = Number(form.equityOffer);
    api.startups
      .publish(body, token)
      .then((created) => {
        setSuccess(
          created.visibilityStatus === 'approved'
            ? 'Startup profile published and visible on the marketplace.'
            : 'Startup profile submitted for admin approval. It will appear on the marketplace once approved.'
        );
        setMyProfiles((prev) => {
          const rest = prev.filter((p) => p.projectId !== created.projectId);
          return [{ ...created, project: created.project } as StartupProfile, ...rest];
        });
      })
      .catch((err: Error) => setError(err.message || 'Failed to publish'))
      .finally(() => setSubmitting(false));
  }

  if (loading) {
    return (
      <div className="max-w-2xl">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const currentProfile = myProfiles.find((p) => p.projectId === form.projectId);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Publish to Marketplace</h1>
      <p className="text-gray-600 mb-6">
        Submit your startup profile so verified investors can discover and fund your business. Profiles require admin
        approval before they appear on the marketplace.
      </p>

      {projects.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          You need at least one project before you can publish to the marketplace. Create a project from your dashboard
          first.
        </div>
      )}

      {projects.length > 0 && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              value={form.projectId}
              onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            >
              <option value="">Select a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName}
                </option>
              ))}
            </select>
            {currentProfile && (
              <p className="mt-1 text-xs text-gray-500">
                Status: <span className="font-medium capitalize">{currentProfile.visibilityStatus.replace('_', ' ')}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pitch summary *</label>
            <textarea
              value={form.pitchSummary}
              onChange={(e) => setForm((f) => ({ ...f, pitchSummary: e.target.value }))}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Brief pitch: problem, solution, market, team..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Traction metrics (optional)</label>
            <textarea
              value={form.tractionMetrics}
              onChange={(e) => setForm((f) => ({ ...f, tractionMetrics: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g. MRR, users, growth rate..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funding needed (USD) *</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={form.fundingNeeded || ''}
                onChange={(e) => setForm((f) => ({ ...f, fundingNeeded: parseFloat(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equity offer % (optional)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={form.equityOffer ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    equityOffer: e.target.value === '' ? undefined : parseFloat(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
            <select
              value={form.stage}
              onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Use project stage</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : currentProfile ? 'Update & resubmit' : 'Submit for approval'}
            </button>
          </div>
        </form>
      )}

      {myProfiles.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-secondary mb-3">Your startup profiles</h2>
          <ul className="space-y-2">
            {myProfiles.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm"
              >
                <span className="font-medium">
                  {(p as StartupProfile & { project?: { projectName?: string } }).project?.projectName ?? p.projectId}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.visibilityStatus === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : p.visibilityStatus === 'pending_approval'
                        ? 'bg-amber-100 text-amber-800'
                        : p.visibilityStatus === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {p.visibilityStatus.replace('_', ' ')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

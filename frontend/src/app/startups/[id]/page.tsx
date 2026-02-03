'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Nav, Footer } from '@/components/landing';
import { getStoredToken, api } from '@/lib/api';
import type { StartupProfileDetail } from '@/lib/api';

const API_BASE = typeof window === 'undefined' ? process.env.NEXT_PUBLIC_API_URL || '' : '';

export default function StartupProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [startup, setStartup] = useState<StartupProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState<'express' | 'meeting' | 'commit' | null>(null);
  const [commitAmount, setCommitAmount] = useState('');
  const [commitEquity, setCommitEquity] = useState('');
  const token = getStoredToken();

  useEffect(() => {
    if (!id) return;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    fetch(`${API_BASE}/api/v1/startups/${id}`, { headers })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Not found'))))
      .then(setStartup)
      .catch((e) => setError(e.message ?? 'Not found'))
      .finally(() => setLoading(false));
  }, [id, token]);

  async function handleExpressInterest(requestMeeting: boolean) {
    if (!token) {
      router.push('/login?redirect=' + encodeURIComponent('/startups/' + id));
      return;
    }
    setError('');
    try {
      await api.investments.expressInterest({ startupId: id, requestMeeting }, token);
      setAction(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function handleCommit() {
    if (!token) {
      router.push('/login?redirect=' + encodeURIComponent('/startups/' + id));
      return;
    }
    setError('');
    try {
      await api.investments.commit(
        {
          startupId: id,
          amount: commitAmount ? parseFloat(commitAmount) : undefined,
          equityPercent: commitEquity ? parseFloat(commitEquity) : undefined,
        },
        token
      );
      setAction(null);
      setCommitAmount('');
      setCommitEquity('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-text-dark">
        <Nav />
        <main className="mx-auto max-w-4xl px-4 py-12">
          <p className="text-gray-500">Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !startup) {
    return (
      <div className="min-h-screen bg-background text-text-dark">
        <Nav />
        <main className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-xl bg-red-50 text-red-700 px-4 py-3">{error}</div>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">← Back to home</Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (!startup) return null;

  const project = startup.project;
  const fullView = startup.fullView === true;
  const name = project?.projectName ?? 'Startup';
  const industry = project?.client?.industry ?? '—';
  const country = startup.country ?? '—';

  return (
    <div className="min-h-screen bg-background text-text-dark">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/dashboard/investor/marketplace" className="text-sm text-primary hover:underline">
            ← Marketplace
          </Link>
          <Link href="/investors" className="text-sm text-gray-500 hover:underline">Investors</Link>
        </div>
        {!fullView && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 mb-6">
            <p className="text-sm font-medium">Partial preview</p>
            <p className="text-sm mt-1">Sign in as a verified investor to see full details, traction, product links, AI evaluation, timeline, documents, and to express interest or commit.</p>
            <Link href="/login?redirect=" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">Sign in</Link>
          </div>
        )}

        {/* Header */}
        <header className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary">{name}</h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-gray-600 text-sm">
            <span>{industry}</span>
            <span>·</span>
            <span>{startup.stage}</span>
            <span>·</span>
            <span>Funding: {Number(startup.fundingNeeded).toLocaleString()}</span>
            <span>·</span>
            <span>{country}</span>
          </div>
          {project?.client?.businessName && (
            <p className="mt-2 text-gray-500 text-sm">{project.client.businessName}</p>
          )}
        </header>

        {/* Pitch Summary */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-semibold text-secondary mb-3">💡 Pitch Summary</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{startup.pitchSummary}</p>
        </section>

        {/* Traction (full only) */}
        {fullView && startup.tractionMetrics && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 mb-6">
            <h2 className="text-lg font-semibold text-secondary mb-3">📊 Traction & Metrics</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{startup.tractionMetrics}</p>
          </section>
        )}

        {/* Product (full only) */}
        {fullView && (startup.liveUrl || startup.repoUrl || (startup.screenshots && startup.screenshots.length > 0)) && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 mb-6">
            <h2 className="text-lg font-semibold text-secondary mb-3">🚀 Product</h2>
            {startup.screenshots && startup.screenshots.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {startup.screenshots.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-gray-200 w-48 h-28 bg-gray-100">
                    <img src={url} alt={`Screenshot ${i + 1}`} className="object-cover w-full h-full" />
                  </a>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-4">
              {startup.liveUrl && (
                <a href={startup.liveUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
                  Live link →
                </a>
              )}
              {startup.repoUrl && (
                <a href={startup.repoUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
                  Repo link →
                </a>
              )}
            </div>
          </section>
        )}

        {/* AI Evaluation (full only) */}
        {fullView && (startup.aiFeasibilityScore != null || startup.aiRiskLevel || startup.aiMarketPotential) && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 mb-6">
            <h2 className="text-lg font-semibold text-secondary mb-3">🧠 AI Evaluation</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {startup.aiFeasibilityScore != null && (
                <div>
                  <p className="text-sm text-gray-500">Feasibility score</p>
                  <p className="font-semibold text-secondary">{startup.aiFeasibilityScore}/100</p>
                </div>
              )}
              {startup.aiRiskLevel && (
                <div>
                  <p className="text-sm text-gray-500">Risk level</p>
                  <p className="font-semibold text-secondary">{startup.aiRiskLevel}</p>
                </div>
              )}
              {startup.aiMarketPotential && (
                <div>
                  <p className="text-sm text-gray-500">Market potential</p>
                  <p className="font-semibold text-secondary">{startup.aiMarketPotential}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Investment Info */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-semibold text-secondary mb-3">💰 Investment Info</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Funding needed</p>
              <p className="font-semibold text-secondary">{Number(startup.fundingNeeded).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Equity offered</p>
              <p className="font-semibold text-secondary">{startup.equityOffer != null ? `${startup.equityOffer}%` : '—'}</p>
            </div>
          </div>
        </section>

        {/* Timeline (full only) */}
        {fullView && project?.milestones && project.milestones.length > 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 mb-6">
            <h2 className="text-lg font-semibold text-secondary mb-3">📅 Timeline</h2>
            <ul className="space-y-2">
              {project.milestones.map((m) => (
                <li key={m.id} className="flex items-center gap-3 text-sm">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                    {m.status}
                  </span>
                  <span className="font-medium text-gray-800">{m.title}</span>
                  {m.dueDate && <span className="text-gray-500">{new Date(m.dueDate).toLocaleDateString()}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Documents (full only) */}
        {fullView && startup.pitchDeckUrl && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 mb-6">
            <h2 className="text-lg font-semibold text-secondary mb-3">📄 Documents</h2>
            <a href={startup.pitchDeckUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
              Pitch deck →
            </a>
          </section>
        )}

        {/* CTAs */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-secondary mb-3">Take action</h2>
          {!token ? (
            <p className="text-gray-600 text-sm mb-4">Sign in or register as an investor to express interest, request a meeting, or commit.</p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleExpressInterest(false)}
              disabled={!token}
              className="rounded-xl border border-primary px-4 py-2.5 text-primary font-medium hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Express Interest
            </button>
            <button
              type="button"
              onClick={() => handleExpressInterest(true)}
              disabled={!token}
              className="rounded-xl border border-primary px-4 py-2.5 text-primary font-medium hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Request Meeting
            </button>
            <button
              type="button"
              onClick={() => setAction('commit')}
              disabled={!token}
              className="rounded-xl bg-primary px-4 py-2.5 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Commit Investment
            </button>
          </div>
          {action === 'commit' && (
            <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Commit amount & equity</p>
              <input
                type="number"
                placeholder="Amount"
                value={commitAmount}
                onChange={(e) => setCommitAmount(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-32 mr-2"
              />
              <input
                type="number"
                placeholder="Equity %"
                value={commitEquity}
                onChange={(e) => setCommitEquity(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-24 mr-2"
              />
              <button type="button" onClick={handleCommit} className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:opacity-90">
                Submit commitment
              </button>
              <button type="button" onClick={() => setAction(null)} className="ml-2 rounded-lg border border-gray-200 px-4 py-2 text-sm">
                Cancel
              </button>
            </div>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </section>
      </main>
      <Footer />
    </div>
  );
}

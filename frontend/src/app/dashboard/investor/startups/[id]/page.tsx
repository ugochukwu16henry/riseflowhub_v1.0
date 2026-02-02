'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStoredToken, api } from '@/lib/api';
import type { StartupProfileDetail } from '@/lib/api';

export default function StartupDetailPage() {
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
    api.startups
      .get(id, token ?? undefined)
      .then(setStartup)
      .catch((e) => setError(e.message ?? 'Not found'))
      .finally(() => setLoading(false));
  }, [id, token]);

  async function handleExpressInterest(requestMeeting: boolean) {
    if (!token) {
      router.push('/login');
      return;
    }
    setError('');
    try {
      await api.investments.expressInterest({ startupId: id, requestMeeting }, token);
      setAction(null);
      setError('');
      setStartup((prev) => prev ? { ...prev } : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function handleCommit() {
    if (!token) {
      router.push('/login');
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
      setStartup((prev) => prev ? { ...prev } : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error && !startup) return <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3">{error}</div>;
  if (!startup) return null;

  const project = startup.project;

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/investor/marketplace" className="text-sm text-primary hover:underline mb-4 inline-block">
        ← Back to Marketplace
      </Link>
      <h1 className="text-2xl font-bold text-secondary mb-2">{project?.projectName ?? 'Startup'}</h1>
      <p className="text-gray-600 mb-6">{project?.client?.businessName} · {project?.client?.industry ?? '—'}</p>

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <h2 className="font-semibold text-secondary mb-2">Pitch summary</h2>
        <p className="text-gray-600 whitespace-pre-wrap">{startup.pitchSummary}</p>
      </div>

      {startup.tractionMetrics && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h2 className="font-semibold text-secondary mb-2">Traction & metrics</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{startup.tractionMetrics}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500 mb-1">Funding needed</p>
          <p className="font-semibold text-secondary">{Number(startup.fundingNeeded).toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500 mb-1">Equity offer</p>
          <p className="font-semibold text-secondary">{startup.equityOffer != null ? `${startup.equityOffer}%` : '—'}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500 mb-1">Stage</p>
          <p className="font-semibold text-secondary">{startup.stage}</p>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 mb-4">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold text-secondary mb-3">Take action</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleExpressInterest(false)}
            className="rounded-lg border border-primary px-4 py-2 text-primary font-medium hover:bg-primary/5"
          >
            Express interest
          </button>
          <button
            type="button"
            onClick={() => handleExpressInterest(true)}
            className="rounded-lg border border-primary px-4 py-2 text-primary font-medium hover:bg-primary/5"
          >
            Request meeting
          </button>
          <button
            type="button"
            onClick={() => setAction('commit')}
            className="rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90"
          >
            Commit / Fund
          </button>
        </div>
        {action === 'commit' && (
          <div className="mt-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
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
            <button
              type="button"
              onClick={handleCommit}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:opacity-90"
            >
              Submit commitment
            </button>
            <button
              type="button"
              onClick={() => setAction(null)}
              className="ml-2 rounded-lg border border-gray-200 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

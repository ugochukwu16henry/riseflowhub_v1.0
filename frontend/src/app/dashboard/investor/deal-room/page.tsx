'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getStoredToken, api } from '@/lib/api';
import type { DealRoomStartup } from '@/lib/api';

export default function InvestorDealRoomPage() {
  const router = useRouter();
  const token = getStoredToken();
  const [startups, setStartups] = useState<DealRoomStartup[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    Promise.all([
      api.dealRoom.list(token).then(setStartups).catch(() => setStartups([])),
      api.dealRoom.listSaved(token).then((ids) => setSavedIds(new Set(ids))).catch(() => setSavedIds(new Set())),
    ]).finally(() => setLoading(false));
  }, [token, router]);

  async function toggleSave(startupId: string, isSaved: boolean) {
    if (!token) return;
    try {
      if (isSaved) {
        await api.dealRoom.unsave(startupId, token);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(startupId);
          return next;
        });
      } else {
        await api.dealRoom.save(startupId, token);
        setSavedIds((prev) => new Set(prev).add(startupId));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  if (!token) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-secondary mb-2">Investor Deal Room</h1>
      <p className="text-gray-600 mb-6">
        Structured funding environment. Review approved startups, express interest, request meetings, save opportunities, and message founders.
      </p>

      {error && (
        <div className="rounded-lg bg-amber-50 text-amber-800 px-4 py-3 mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-amber-600 hover:underline">Dismiss</button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : startups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center text-gray-500">
          No startups in the Deal Room yet. Approved and investor-ready startups will appear here.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {startups.map((s) => {
            const project = s.project;
            const industry = project?.client?.industry ?? '—';
            const isSaved = savedIds.has(s.id);
            return (
              <div
                key={s.id}
                className="rounded-xl border border-gray-200 bg-white p-6 hover:border-primary/30 hover:shadow-md transition flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Link href={`/dashboard/investor/deal-room/${s.id}`} className="font-semibold text-secondary text-lg hover:underline flex-1 min-w-0 truncate">
                    {project?.projectName ?? 'Startup'}
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleSave(s.id, isSaved)}
                    className="flex-shrink-0 text-gray-500 hover:text-primary"
                    title={isSaved ? 'Unsave' : 'Save'}
                  >
                    {isSaved ? '★' : '☆'}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-2">{industry}</p>
                <p className="text-sm text-gray-600 mb-2 capitalize">Stage: {s.stage}</p>
                <p className="text-sm font-medium text-secondary mb-2">
                  Funding ask: {Number(s.fundingNeeded).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 line-clamp-2 flex-1">{s.tractionMetrics || s.pitchSummary?.slice(0, 120) || '—'}</p>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/dashboard/investor/deal-room/${s.id}`}
                    className="rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium hover:opacity-90"
                  >
                    View profile
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

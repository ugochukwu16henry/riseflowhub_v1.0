'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { StartupProfileListItem } from '@/lib/api';

export default function MarketplacePage() {
  const [startups, setStartups] = useState<StartupProfileListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [industry, setIndustry] = useState('');
  const [stage, setStage] = useState('');
  const [fundingMin, setFundingMin] = useState('');
  const [fundingMax, setFundingMax] = useState('');

  useEffect(() => {
    const params: { industry?: string; stage?: string; fundingMin?: string; fundingMax?: string } = {};
    if (industry) params.industry = industry;
    if (stage) params.stage = stage;
    if (fundingMin) params.fundingMin = fundingMin;
    if (fundingMax) params.fundingMax = fundingMax;
    api.startups
      .marketplace(params as { industry?: string; stage?: string; fundingMin?: number; fundingMax?: number })
      .then(setStartups)
      .catch(() => setStartups([]))
      .finally(() => setLoading(false));
  }, [industry, stage, fundingMin, fundingMax]);

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Startup Marketplace</h1>
      <p className="text-gray-600 mb-6">
        Browse approved startups. Filter by industry, stage, or funding size.
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-40"
        />
        <input
          type="text"
          placeholder="Stage"
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-40"
        />
        <input
          type="number"
          placeholder="Min funding"
          value={fundingMin}
          onChange={(e) => setFundingMin(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-32"
        />
        <input
          type="number"
          placeholder="Max funding"
          value={fundingMax}
          onChange={(e) => setFundingMax(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-32"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : startups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center text-gray-500">
          No approved startups in the marketplace yet. Check back later.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {startups.map((s) => (
            <Link
              key={s.id}
              href={`/startups/${s.id}`}
              className="rounded-xl border border-gray-200 bg-white p-6 hover:border-primary hover:shadow-md transition"
            >
              <h2 className="font-semibold text-secondary mb-1">{s.project?.projectName ?? 'Startup'}</h2>
              <p className="text-sm text-gray-500 mb-2">{s.project?.client?.businessName}</p>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{s.pitchSummary}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-gray-100 px-2 py-0.5">{s.stage}</span>
                <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5">
                  Funding: {Number(s.fundingNeeded).toLocaleString()}
                </span>
                {s.equityOffer != null && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5">{s.equityOffer}% equity</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

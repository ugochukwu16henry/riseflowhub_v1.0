'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStoredToken, api } from '@/lib/api';

export default function HirerSendHirePage() {
  const params = useParams();
  const router = useRouter();
  const talentId = params.talentId as string;
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const token = getStoredToken();
    if (!token) {
      setError('Not logged in');
      setLoading(false);
      return;
    }
    try {
      await api.hiring.hire(talentId, { projectTitle: projectTitle.trim(), projectDescription: projectDescription.trim() || undefined }, token);
      router.push('/dashboard/hirer/hires');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send hire request');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Send hire request</h1>
      <p className="text-gray-600 text-sm mb-4">Talent ID: {talentId}. You must have paid the platform fee and signed the Fair Treatment Agreement.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project title *</label>
          <input type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project description</label>
          <textarea value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={loading} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">Send request</button>
        <Link href="/talent-marketplace" className="ml-3 text-gray-600 hover:underline">Cancel</Link>
      </form>
    </div>
  );
}

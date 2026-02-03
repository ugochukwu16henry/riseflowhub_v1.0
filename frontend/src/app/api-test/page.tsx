'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { getStoredToken } from '@/lib/api';

type Result = { name: string; ok: boolean; ms?: number; status?: number; error?: string };

export default function ApiTestPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [running, setRunning] = useState(false);
  const token = getStoredToken();

  const run = useCallback(async () => {
    setRunning(true);
    const out: Result[] = [];

    async function check(name: string, fn: () => Promise<Response>) {
      const start = Date.now();
      try {
        const res = await fn();
        const ms = Date.now() - start;
        const ok = res.ok;
        if (!ok) {
          const text = await res.text();
          out.push({ name, ok: false, ms, status: res.status, error: text.slice(0, 120) });
        } else {
          out.push({ name, ok: true, ms, status: res.status });
        }
      } catch (e) {
        out.push({ name, ok: false, ms: Date.now() - start, error: e instanceof Error ? e.message : 'Failed to fetch' });
      }
      setResults([...out]);
    }

    // Public
    await check('GET /api/v1/health', () => fetch('/api/v1/health'));
    await check('GET /api/v1/setup-fee/config', () => fetch('/api/v1/setup-fee/config'));
    await check('GET /api/v1/setup-fee/quote?currency=USD', () => fetch('/api/v1/setup-fee/quote?currency=USD'));

    // Auth (no token)
    await check('POST /api/v1/auth/login (invalid) → 401', () =>
      fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'bad@x.com', password: 'wrong' }),
      })
    );

    if (token) {
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      await check('GET /api/v1/auth/me', () => fetch('/api/v1/auth/me', { headers }));
      await check('GET /api/v1/projects', () => fetch('/api/v1/projects', { headers }));
      await check('GET /api/v1/notifications', () => fetch('/api/v1/notifications', { headers }));
      await check('GET /api/v1/tasks/me', () => fetch('/api/v1/tasks/me', { headers }));
      await check('GET /api/v1/agreements/assigned', () => fetch('/api/v1/agreements/assigned', { headers }));
      await check('GET /api/v1/startups/marketplace', () => fetch('/api/v1/startups/marketplace'));
    } else {
      out.push({ name: 'Protected endpoints (login to test)', ok: true, error: 'No token — sign in to test /auth/me, /projects, etc.' });
      setResults([...out]);
    }

    setRunning(false);
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">API connectivity test</h1>
          <Link href="/login" className="text-sm text-primary hover:underline">
            {token ? 'Signed in' : 'Sign in'}
          </Link>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          Calls your app’s API (via same origin). Use this to verify the backend is reachable after deploy.
        </p>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="rounded-lg bg-primary text-white px-4 py-2 font-medium hover:opacity-90 disabled:opacity-50"
        >
          {running ? 'Running…' : 'Run tests'}
        </button>
        <ul className="mt-6 space-y-2">
          {results.map((r, i) => (
            <li
              key={i}
              className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm ${
                r.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <span className="font-medium shrink-0">{r.ok ? '✓' : '✗'}</span>
              <span className="font-mono">{r.name}</span>
              {r.ms != null && r.ok && <span className="text-gray-500 shrink-0">{r.ms}ms</span>}
              {r.status != null && !r.ok && <span className="shrink-0">HTTP {r.status}</span>}
              {r.error && <span className="truncate" title={r.error}>{r.error}</span>}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-gray-500 text-xs">
          Requests go to the same origin (e.g. your Vercel URL); Next.js rewrites proxy to the backend when{' '}
          <code className="bg-gray-200 px-1">NEXT_PUBLIC_API_URL</code> is set.
        </p>
      </div>
    </div>
  );
}

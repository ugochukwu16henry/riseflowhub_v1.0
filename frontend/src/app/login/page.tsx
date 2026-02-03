'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api, setStoredToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'fail' | null>(null);

  useEffect(() => {
    fetch('/api/v1/health')
      .then((r) => {
        if (r.ok) return r.json();
        return Promise.reject(new Error(`${r.status} ${r.statusText}`));
      })
      .then(() => setApiStatus('ok'))
      .catch(() => setApiStatus('fail'));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tenantDomain = typeof window !== 'undefined' ? window.location.hostname : undefined;
      const data = await api.auth.login({ email, password }, tenantDomain);
      setStoredToken(data.token);
      const role = data.user?.role;
      if (role === 'super_admin' || role === 'project_manager' || role === 'finance_admin') {
        router.push('/dashboard/admin');
      } else if (role === 'investor') {
        router.push('/dashboard/investor');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      if (msg === 'Failed to fetch' || msg.includes('fetch')) {
        setError('Cannot reach the server. If you just opened the app, wait 30–60s (backend may be waking) and try again. Otherwise check that the backend is running and NEXT_PUBLIC_API_URL is set on Vercel, then redeploy.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex justify-center mb-4">
          <Image
            src="/Afrilauch_logo.png"
            alt="AfriLaunch Hub"
            width={180}
            height={56}
            priority
            className="h-14 w-auto object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-primary mb-2 text-center">AfriLaunch Hub</h1>
        <p className="text-secondary text-sm mb-6 text-center">Sign in to your account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {apiStatus === 'fail' && (
            <div className="rounded-lg bg-amber-50 text-amber-800 px-3 py-2 text-sm space-y-1">
              <p className="font-medium">API unreachable (404 = proxy not set).</p>
              <p>On Vercel: add <strong>NEXT_PUBLIC_API_URL</strong> = your Render URL (e.g. <code className="bg-amber-100 px-1">https://afrilauch-v1-0.onrender.com</code>), then <strong>Redeploy</strong> and turn <strong>off</strong> “Use existing Build Cache” so the rewrite is applied.</p>
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

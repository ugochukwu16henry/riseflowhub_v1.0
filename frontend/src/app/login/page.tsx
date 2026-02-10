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
    const base = process.env.NEXT_PUBLIC_API_URL || '';
    const healthUrl = base ? `${base.replace(/\/$/, '')}/api/v1/health` : '/api/v1/health';
    fetch(healthUrl)
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
      if (!data || typeof data.token !== 'string') {
        setError('Invalid login response (missing token). Try again or check backend logs.');
        return;
      }
      if (!data.user) {
        setError('Invalid login response (missing user). Try again or check backend logs.');
        return;
      }
      setStoredToken(data.token);
      const role = data.user.role;
      if (role === 'super_admin' || role === 'project_manager' || role === 'finance_admin' || role === 'cofounder') {
        router.push('/dashboard/admin');
      } else if (role === 'investor') {
        router.push('/dashboard/investor');
      } else if (role === 'talent') {
        router.push('/dashboard/talent');
      } else if (role === 'hirer' || role === 'hiring_company') {
        router.push('/dashboard/hirer');
      } else if (role === 'hr_manager') {
        router.push('/dashboard/admin/hr');
      } else if (role === 'legal_team') {
        router.push('/dashboard/legal');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'Login failed. Check the browser console for details.';
      if (msg === 'Failed to fetch' || msg.includes('fetch') || msg.includes('502') || msg.includes('Bad Gateway') || msg.includes('NetworkError')) {
        setError('Backend not responding. Set NEXT_PUBLIC_API_URL on Vercel to your Render backend URL (e.g. https://riseflowhub-v1-0-1.onrender.com) and FRONTEND_URL on Render to this site’s URL, then redeploy both. If you’re on a paid plan and it still fails, check the Render dashboard that the service is running and the URL is correct.');
      } else if (msg === 'Unauthorized' || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('401')) {
        setError('Invalid email or password. If this is a fresh deploy, seed the DB. Use the Super Admin from seed (e.g. test-super_admin@example.com / Password123).');
      } else if (msg.includes('CORS') || msg.includes('Access-Control')) {
        setError('Request blocked (CORS). Set FRONTEND_URL on Render to your Vercel site URL (no trailing slash), then redeploy the backend.');
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
            src="/RiseFlowHub%20logo.png"
            alt="RiseFlow Hub"
            width={180}
            height={56}
            priority
            className="h-14 w-auto object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-primary mb-2 text-center">RiseFlow Hub</h1>
        <p className="text-secondary text-sm mb-6 text-center">Sign in to your account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {apiStatus === 'fail' && (
            <div className="rounded-lg bg-amber-50 text-amber-800 px-3 py-2 text-sm space-y-1">
              <p className="font-medium">API unreachable (404 or 502).</p>
              <p>Set <strong>NEXT_PUBLIC_API_URL</strong> on Vercel to your Render backend URL (e.g. <code className="bg-amber-100 px-1">https://riseflowhub-v1-0-1.onrender.com</code>). Set <strong>FRONTEND_URL</strong> on Render to this site’s URL. Redeploy both (Vercel: clear cache if needed). If the backend is paid and still unreachable, check the Render dashboard that the service is running.</p>
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

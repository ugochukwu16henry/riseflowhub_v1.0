'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, setStoredToken } from '@/lib/api';

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'success'>('loading');
  const [email, setEmail] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }
    api.team
      .getAcceptInvite(token)
      .then((data) => {
        if ('valid' in data && data.valid && data.email) {
          setStatus('valid');
          setEmail(data.email);
          setRoleLabel(data.roleLabel ?? data.role ?? 'team member');
        } else {
          setStatus('invalid');
        }
      })
      .catch(() => setStatus('invalid'));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !name.trim() || !password) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await api.team.postAcceptInvite({ token, name: name.trim(), password });
      setStoredToken(res.token);
      setStatus('success');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {status === 'loading' && (
          <p className="text-center text-gray-600">Checking invitation...</p>
        )}
        {status === 'invalid' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-secondary">Invalid or expired invite</h1>
            <p className="mt-2 text-gray-600">This link may have expired or already been used.</p>
            <Link href="/login" className="mt-6 inline-block text-primary font-medium hover:underline">
              Go to login
            </Link>
          </div>
        )}
        {status === 'valid' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-bold text-secondary">Join the team</h1>
            <p className="mt-2 text-gray-600">
              You&apos;ve been invited as <strong>{roleLabel}</strong>. Set your password to continue.
            </p>
            <p className="mt-1 text-sm text-gray-500">{email}</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="block text-sm font-medium text-gray-700">Full name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-secondary"
                  placeholder="Your name"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700">Password (min 6 characters)</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-secondary"
                />
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-primary py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Creating account…' : 'Accept & continue'}
              </button>
            </form>
          </div>
        )}
        {status === 'success' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-primary">You&apos;re in</h1>
            <p className="mt-2 text-gray-600">Redirecting to your dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}

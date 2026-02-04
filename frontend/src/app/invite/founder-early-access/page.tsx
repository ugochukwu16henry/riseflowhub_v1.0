'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

/**
 * Founder Early Access invite link.
 *
 * This page checks whether the Early Founder program still has seats,
 * and either redirects founders into the idea submission flow with a
 * special `ref` flag, or shows a "Program full" message.
 */
export default function FounderEarlyAccessInvitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [full, setFull] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const status = await api.earlyAccess.status();
        if (cancelled) return;
        if (status.enabled) {
          router.replace('/submit-idea?ref=early_access_superadmin');
        } else {
          setFull(true);
        }
      } catch {
        if (!cancelled) {
          // On error, fall back to normal submit-idea flow (no scholarship flag).
          router.replace('/submit-idea');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading && !full) return null;

  if (full) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-secondary mb-2">Early Founder Program Full</h1>
          <p className="text-sm text-gray-600 mb-4">
            The first 300 scholarship seats have been filled. You can still submit your startup idea and join the platform normally.
          </p>
          <button
            type="button"
            onClick={() => router.replace('/submit-idea')}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Continue to submit my idea
          </button>
        </div>
      </main>
    );
  }

  return null;
}


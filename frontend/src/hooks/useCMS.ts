'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

const cache = new Map<string, { value: unknown; at: number }>();
const CACHE_MS = 60_000; // 1 min

function getCached(key: string): unknown | undefined {
  const entry = cache.get(key);
  if (!entry || Date.now() - entry.at > CACHE_MS) return undefined;
  return entry.value;
}

function setCached(key: string, value: unknown): void {
  cache.set(key, { value, at: Date.now() });
}

/** Clear CMS cache (e.g. after Super Admin updates content). Call after PUT/POST/DELETE CMS. */
export function clearCMSCache(): void {
  cache.clear();
}

/**
 * Reusable hook: fetch CMS content by key. If value exists → return it; else → fallback.
 * @param key - Content key (e.g. "home.hero.title")
 * @param fallback - Default value when key is missing or request fails
 */
export function useCMS<T = string>(key: string, fallback: T): T {
  const [value, setValue] = useState<T>(() => {
    const c = getCached(key);
    return (c !== undefined && c !== null ? c : fallback) as T;
  });

  useEffect(() => {
    const cached = getCached(key);
    if (cached !== undefined && cached !== null) {
      setValue(cached as T);
      return;
    }
    api.cms
      .getByKey(key)
      .then((res) => {
        const v = res.value as T;
        setCached(key, v);
        setValue(v);
      })
      .catch(() => setValue(fallback));
  }, [key, fallback]);

  return value;
}

/**
 * Hook to get all content for a page (e.g. for admin editor or SSR-style data).
 */
export function useCMSPage(pageName: string): {
  contents: Record<string, unknown>;
  loading: boolean;
  error: boolean;
  refetch: () => Promise<void>;
} {
  const [contents, setContents] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.cms.getByPage(pageName);
      setContents(res.contents || {});
    } catch {
      setError(true);
      setContents({});
    } finally {
      setLoading(false);
    }
  }, [pageName]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { contents, loading, error, refetch };
}

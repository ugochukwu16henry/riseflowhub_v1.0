import type { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_URL = process.env.NEXT_PUBLIC_API_URL || APP_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/about',
    '/pricing',
    '/investors',
    '/submit-idea',
    '/talent-marketplace',
    '/hiring',
    '/contact',
    '/privacy',
    '/terms',
  ].map((path) => ({
    url: `${APP_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));

  let dynamic: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/api/v1/startups/marketplace`, {
      // ensure fresh list of startups for sitemap
      next: { revalidate: 60 * 60 },
    });
    if (res.ok) {
      const startups = (await res.json()) as Array<{ id: string; updatedAt?: string }>;
      dynamic = startups.map((s) => ({
        url: `${APP_URL}/startups/${s.id}`,
        lastModified: s.updatedAt ? new Date(s.updatedAt) : new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      }));
    }
  } catch {
    // fail silently; static routes are still returned
  }

  return [...staticRoutes, ...dynamic];
}


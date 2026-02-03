import { NextRequest, NextResponse } from 'next/server';
import { pageContentFallback } from '@/data/pageContent';

/**
 * GET /api/content/[slug]
 * Placeholder for future CMS: Super Admin will save content to DB and this will return it.
 * For now: returns 404 so pages use pageContentFallback.
 * Later: fetch from DB by slug, return JSON.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Intentional: no dynamic content yet — client uses fallback
  if (!slug || !pageContentFallback[slug as keyof typeof pageContentFallback]) {
    return NextResponse.json(
      { error: 'No dynamic content' },
      { status: 404 }
    );
  }

  // Optional: return fallback from API so single source of truth (still "no CMS" — same data)
  // return NextResponse.json(pageContentFallback[slug]);
  return NextResponse.json(
    { error: 'No dynamic content' },
    { status: 404 }
  );
}

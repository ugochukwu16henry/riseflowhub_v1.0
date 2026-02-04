import {
  Nav,
  Hero,
  Problem,
  Solution,
  HowItWorks,
  AIPower,
  ForInvestors,
  PlatformFeatures,
  Vision,
  FinalCTA,
  Footer,
  FAQPreview,
} from '@/components/landing';
import { api, type FaqItem } from '@/lib/api';
import { pageContentFallback } from '@/data/pageContent';
import type { HomePageContent } from '@/data/pageContent';

/**
 * Fetch page content from CMS API. Falls back to static content when API returns 404.
 * Future: Super Admin edits → save to DB → this API returns dynamic content.
 */
async function getPageContent(slug: 'home' = 'home'): Promise<HomePageContent> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/content/${slug}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('No dynamic content');
    return await res.json();
  } catch {
    return pageContentFallback[slug] as HomePageContent;
  }
}

async function getHighlightedFaqs(): Promise<Pick<FaqItem, 'id' | 'question' | 'answer'>[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/faq?highlighted=true&limit=6`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed');
    const data = (await res.json()) as { items: FaqItem[] };
    return data.items.map((i) => ({ id: i.id, question: i.question, answer: i.answer }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const content = await getPageContent();
  const faqs = await getHighlightedFaqs();

  return (
    <div className="min-h-screen bg-background text-text-dark">
      <Nav />
      <main>
        <Hero content={content.hero} />
        <Problem content={content.problem} />
        <Solution content={content.solution} />
        <HowItWorks content={content.howItWorks} />
        <AIPower content={content.aiPower} />
        <ForInvestors content={content.forInvestors} />
        <PlatformFeatures content={content.platformFeatures} />
        <Vision content={content.vision} />
        <FAQPreview items={faqs} />
        <FinalCTA content={content.finalCta} />
        <Footer />
      </main>
    </div>
  );
}

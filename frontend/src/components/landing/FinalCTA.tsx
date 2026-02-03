import { Section } from './Section';
import Link from 'next/link';
import type { HomePageContent } from '@/data/pageContent';

interface FinalCTAProps {
  content: HomePageContent['finalCta'];
}

export function FinalCTA({ content }: FinalCTAProps) {
  return (
    <Section id="cta" variant="muted">
      <div className="mx-auto max-w-2xl text-center">
        {/* CMS-EDITABLE: finalCta.title, finalCta.subtext */}
        <h2 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl">
          {content.title}
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          {content.subtext}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="w-full sm:w-auto rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white hover:opacity-90 transition"
          >
            {/* CMS-EDITABLE: finalCta.ctaPrimary */}
            {content.ctaPrimary}
          </Link>
          <Link
            href="/book-consultation"
            className="w-full sm:w-auto rounded-xl border-2 border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 hover:border-primary/30 hover:bg-gray-50 transition"
          >
            {/* CMS-EDITABLE: finalCta.ctaSecondary */}
            {content.ctaSecondary}
          </Link>
        </div>
      </div>
    </Section>
  );
}

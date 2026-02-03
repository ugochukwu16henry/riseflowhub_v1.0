import { Section } from './Section';
import Link from 'next/link';
import type { HomePageContent } from '@/data/pageContent';

interface ForInvestorsProps {
  content: HomePageContent['forInvestors'];
}

export function ForInvestors({ content }: ForInvestorsProps) {
  return (
    <Section id="investors">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          {/* CMS-EDITABLE: forInvestors.title, forInvestors.body */}
          <h2 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl">
            {content.title}
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            {content.body}
          </p>
          <Link
            href="/dashboard/investor/marketplace"
            className="mt-6 inline-flex rounded-xl bg-secondary px-6 py-3.5 text-base font-semibold text-white hover:opacity-90 transition"
          >
            {/* CMS-EDITABLE: forInvestors.ctaText */}
            {content.ctaText}
          </Link>
        </div>
        <div className="rounded-2xl border border-gray-200/80 bg-gray-50/80 p-8 shadow-sm">
          <ul className="space-y-4 text-gray-700">
            {content.bullets.map((bullet, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {/* CMS-EDITABLE: forInvestors.bullets[] */}
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

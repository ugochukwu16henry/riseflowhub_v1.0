import { Section } from './Section';
import Link from 'next/link';
import type { HomePageContent } from '@/data/pageContent';

interface HowItWorksProps {
  content: HomePageContent['howItWorks'];
}

export function HowItWorks({ content }: HowItWorksProps) {
  return (
    <Section id="how-it-works" variant="muted">
      <div className="text-center">
        {/* CMS-EDITABLE: howItWorks.title, howItWorks.subtext */}
        <h2 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl">
          {content.title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          {content.subtext}
        </p>
      </div>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {content.steps.map((step, i) => (
          <div
            key={i}
            className="group relative rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition hover:border-primary/20 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary transition group-hover:bg-primary/20">
              {step.num}
            </div>
            {/* CMS-EDITABLE: howItWorks.steps[].title, howItWorks.steps[].desc */}
            <h3 className="mt-4 text-lg font-semibold text-text-dark">{step.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{step.desc}</p>
            {i < content.steps.length - 1 && (
              <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-gray-300 lg:block">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link
          href="/register"
          className="inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
        >
          {/* CMS-EDITABLE: howItWorks.ctaText */}
          {content.ctaText}
        </Link>
      </div>
    </Section>
  );
}

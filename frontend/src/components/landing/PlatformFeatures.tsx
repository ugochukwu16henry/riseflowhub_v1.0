import { Section } from './Section';
import type { HomePageContent } from '@/data/pageContent';

interface PlatformFeaturesProps {
  content: HomePageContent['platformFeatures'];
}

export function PlatformFeatures({ content }: PlatformFeaturesProps) {
  return (
    <Section id="features" variant="muted">
      <div className="text-center">
        {/* CMS-EDITABLE: platformFeatures.title, platformFeatures.subtext */}
        <h2 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl">
          {content.title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          {content.subtext}
        </p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {content.features.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm transition hover:border-primary/20 hover:shadow-md"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            {/* CMS-EDITABLE: platformFeatures.features[] */}
            <span className="font-medium text-text-dark">{item}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

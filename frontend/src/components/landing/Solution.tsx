import { Section } from './Section';
import type { HomePageContent } from '@/data/pageContent';

const COLUMN_ICONS = [
  <svg key="1" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
  </svg>,
  <svg key="2" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>,
  <svg key="3" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 011.414-2.17l2.307-2.307M2.25 18l-1.586-7.586a2.25 2.25 0 01.434-1.756L9 11.25l4.306 4.307M18 15l-1.5-1.5M18 15l-3-3m0 0l-3 3m3-3h6" />
  </svg>,
];

interface SolutionProps {
  content: HomePageContent['solution'];
}

export function Solution({ content }: SolutionProps) {
  return (
    <Section id="solution">
      <div className="text-center">
        {/* CMS-EDITABLE: solution.title, solution.subtext */}
        <h2 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl">
          {content.title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          {content.subtext}
        </p>
      </div>
      <div className="mt-16 grid gap-10 md:grid-cols-3">
        {content.columns.map((col, i) => (
          <div
            key={i}
            className="relative rounded-2xl border border-gray-200/80 bg-gray-50/50 p-8 transition hover:border-primary/30 hover:shadow-lg"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {COLUMN_ICONS[i] ?? COLUMN_ICONS[0]}
            </div>
            {/* CMS-EDITABLE: solution.columns[].title, solution.columns[].description */}
            <h3 className="mt-6 text-xl font-semibold text-text-dark">{col.title}</h3>
            <p className="mt-3 text-gray-600 leading-relaxed">{col.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

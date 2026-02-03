import { Section } from './Section';
import type { HomePageContent } from '@/data/pageContent';

interface AIPowerProps {
  content: HomePageContent['aiPower'];
}

export function AIPower({ content }: AIPowerProps) {
  return (
    <Section id="ai-power" variant="dark">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          {/* CMS-EDITABLE: aiPower.title, aiPower.body */}
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {content.title}
          </h2>
          <p className="mt-4 text-lg text-white/85">
            {content.body}
          </p>
        </div>
        <ul className="space-y-4">
          {content.features.map((item, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-white backdrop-blur-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/90 text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              {/* CMS-EDITABLE: aiPower.features[] */}
              <span className="font-medium">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

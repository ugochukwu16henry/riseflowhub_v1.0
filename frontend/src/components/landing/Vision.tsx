import { Section } from './Section';
import type { HomePageContent } from '@/data/pageContent';

interface VisionProps {
  content: HomePageContent['vision'];
}

export function Vision({ content }: VisionProps) {
  return (
    <Section variant="default" className="text-center">
      <blockquote className="mx-auto max-w-3xl">
        {/* CMS-EDITABLE: vision.statement */}
        <p className="text-2xl font-medium leading-relaxed text-text-dark sm:text-3xl">
          {content.statement}
        </p>
      </blockquote>
    </Section>
  );
}

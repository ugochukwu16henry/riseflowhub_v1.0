import { Section } from './Section';
import Link from 'next/link';

export function FinalCTA() {
  return (
    <Section id="cta" variant="muted">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl">
          Have an Idea? Let&apos;s Build It.
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Start your project or book a consultation — we&apos;re here to help you launch.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="w-full sm:w-auto rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white hover:opacity-90 transition"
          >
            Start My Project
          </Link>
          <Link
            href="/book-consultation"
            className="w-full sm:w-auto rounded-xl border-2 border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 hover:border-primary/30 hover:bg-gray-50 transition"
          >
            Book a Consultation
          </Link>
        </div>
      </div>
    </Section>
  );
}

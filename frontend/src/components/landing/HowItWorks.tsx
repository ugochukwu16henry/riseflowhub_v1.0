import { Section } from './Section';
import Link from 'next/link';

const STEPS = [
  { num: 1, title: 'Submit Your Idea', desc: 'Share your vision and goals in a simple form.' },
  { num: 2, title: 'Get AI Evaluation & Proposal', desc: 'Receive feasibility scoring, scope, and a tailored proposal.' },
  { num: 3, title: 'We Build Your Product', desc: 'Our team builds your website, app, or software.' },
  { num: 4, title: 'Launch & Market', desc: 'Go live with marketing systems and analytics.' },
  { num: 5, title: 'Meet Investors', desc: 'Access our investor network and startup marketplace.' },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" variant="muted">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl">
          How It Works
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          From idea to launch in five clear steps.
        </p>
      </div>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className="group relative rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition hover:border-primary/20 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary transition group-hover:bg-primary/20">
              {step.num}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-text-dark">{step.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{step.desc}</p>
            {i < STEPS.length - 1 && (
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
          Start with step 1
        </Link>
      </div>
    </Section>
  );
}

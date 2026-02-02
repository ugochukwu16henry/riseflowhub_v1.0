import { Section } from './Section';

const FEATURES = [
  'Client dashboards',
  'Project tracking',
  'Milestones & tasks',
  'Repo links',
  'Marketing analytics',
  'Secure agreements',
];

export function PlatformFeatures() {
  return (
    <Section id="features" variant="muted">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl">
          Platform Features
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Everything you need to build, track, and scale — in one place.
        </p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm transition hover:border-primary/20 hover:shadow-md"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="font-medium text-text-dark">{item}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

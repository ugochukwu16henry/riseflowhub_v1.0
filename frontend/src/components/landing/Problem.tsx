import { Section } from './Section';

const PROBLEMS = [
  {
    title: 'No tech team',
    description: 'Ideas stay on paper without the engineering to build products.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
  },
  {
    title: 'No guidance',
    description: 'Missing structure, business planning, and clear milestones.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
  },
  {
    title: 'No access to investors',
    description: 'Great ideas never get in front of the right capital.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 011.414-2.17l2.307-2.307M2.25 18l-1.586-7.586a2.25 2.25 0 01.434-1.756L9 11.25l4.306 4.307M18 15l-1.5-1.5M18 15l-3-3m0 0l-3 3m3-3h6" />
      </svg>
    ),
  },
];

export function Problem() {
  return (
    <Section id="problem" variant="muted">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl">
          Great Ideas Shouldn&apos;t Die in Notebooks
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Many entrepreneurs have the vision — but lack the tech, structure, and visibility to turn it into a real business.
        </p>
      </div>
      <div className="mt-12 grid gap-8 sm:grid-cols-3">
        {PROBLEMS.map((item, i) => (
          <div
            key={i}
            className="group rounded-2xl border border-gray-200/80 bg-white p-8 shadow-sm transition hover:shadow-md hover:border-primary/20"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
              {item.icon}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-text-dark">{item.title}</h3>
            <p className="mt-2 text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

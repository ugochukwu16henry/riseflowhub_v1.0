import Link from 'next/link';
import { Nav, Section, Footer } from '@/components/landing';

export const metadata = {
  title: 'Pricing — AfriLaunch Hub',
  description:
    'Transparent, startup-friendly pricing. We structure pricing based on scope, complexity, and growth goals — with setup fees, milestone payments, and optional subscription.',
};

const PLANS = [
  {
    name: 'Idea Starter',
    price: 'Starting from $799',
    priceNote: 'One-time',
    features: [
      'Idea evaluation',
      'Business structuring session',
      'Basic roadmap',
    ],
    cta: 'Get started',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Startup Builder',
    price: 'Starting from $4,500',
    priceNote: 'Milestone-based',
    features: [
      'Website or MVP build',
      'Client dashboard',
      'Branding setup',
      'Marketing starter',
    ],
    cta: 'Get my proposal',
    href: '/register',
    highlighted: true,
  },
  {
    name: 'Growth Engine',
    price: 'Custom',
    priceNote: 'Tailored to your scope',
    features: [
      'Full app/software',
      'Marketing campaigns',
      'Analytics dashboard',
      'AI growth insights',
    ],
    cta: 'Get my proposal',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Venture Partner',
    price: 'Custom',
    priceNote: 'Equity-friendly options',
    features: [
      'Full build',
      'Growth marketing',
      'Investor readiness',
      'Ongoing support',
      'Possible equity model',
    ],
    cta: 'Let\'s talk',
    href: '/register',
    highlighted: false,
  },
];

const PAYMENT_ITEMS = [
  {
    title: 'Setup fee',
    description: 'A clear upfront fee to kick off your project and lock scope.',
  },
  {
    title: 'Milestone payments',
    description: 'Pay as we hit agreed milestones — no big lump sum upfront.',
  },
  {
    title: 'Optional monthly subscription',
    description: 'Ongoing support, hosting, or growth services on a monthly plan.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-text-dark">
      <Nav />

      {/* Intro */}
      <section className="relative overflow-hidden bg-white px-4 py-16 sm:py-20">
        <div
          className="absolute inset-0 -z-10 opacity-30"
          style={{
            background: 'linear-gradient(165deg, #E8F4EE 0%, #E8EEF7 100%)',
          }}
        />
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl md:text-5xl">
            Transparent, Startup-Friendly Pricing
          </h1>
          <p className="mt-6 text-lg text-gray-600 leading-relaxed">
            Every idea is different. We structure pricing based on scope, complexity, and growth goals.
          </p>
        </div>
      </section>

      {/* Plans */}
      <Section id="plans" variant="muted">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan, i) => (
            <div
              key={i}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md ${
                plan.highlighted
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-gray-200/80 hover:border-primary/20'
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
                  Popular
                </span>
              )}
              <h3 className="text-lg font-bold text-text-dark">{plan.name}</h3>
              <p className="mt-2 text-2xl font-bold text-primary">{plan.price}</p>
              <p className="text-sm text-gray-500">{plan.priceNote}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-0.5 shrink-0 text-primary">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                  plan.highlighted
                    ? 'bg-primary text-white hover:opacity-90'
                    : 'border-2 border-gray-300 text-gray-700 hover:border-primary hover:text-primary'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* Payment structure */}
      <Section id="payment">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
            How You Pay
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Flexible payment structure — no surprises.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {PAYMENT_ITEMS.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-6 transition hover:border-primary/20 hover:bg-primary/5"
            >
              <h3 className="text-lg font-semibold text-text-dark">{item.title}</h3>
              <p className="mt-2 text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section variant="dark">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Get My Custom Proposal
          </h2>
          <p className="mt-4 text-white/85">
            Tell us your idea and goals — we&apos;ll send a tailored proposal with scope and pricing.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 hover:opacity-90 transition"
          >
            Get My Custom Proposal
          </Link>
        </div>
      </Section>

      <Footer />
    </div>
  );
}

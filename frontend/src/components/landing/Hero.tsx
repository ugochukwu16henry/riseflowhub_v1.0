import Link from 'next/link';
import Image from 'next/image';

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Background gradient + subtle grid */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: 'linear-gradient(165deg, #F7F9FB 0%, #E8F4EE 35%, #D6EBE3 70%, #E8EEF7 100%)',
        }}
      />
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230B3C5D' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="mx-auto max-w-4xl text-center">
        <Image
          src="/Afrilauch_logo.png"
          alt="AfriLaunch Hub"
          width={120}
          height={48}
          priority
          className="mx-auto mb-8 h-12 w-auto object-contain opacity-95"
        />
        <h1 className="text-4xl font-bold tracking-tight text-text-dark sm:text-5xl md:text-6xl">
          Where Ideas Become{' '}
          <span className="text-primary">Real Businesses</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 sm:text-xl leading-relaxed">
          We help entrepreneurs turn their ideas into websites, apps, and scalable startups — with tech, guidance, marketing, and investor access.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/submit-idea"
            className="w-full sm:w-auto rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Launch My Idea
          </Link>
          <Link
            href="/dashboard/investor/marketplace"
            className="w-full sm:w-auto rounded-xl border-2 border-secondary/30 bg-white px-8 py-3.5 text-base font-semibold text-secondary hover:bg-secondary/5 transition focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
          >
            Explore Startups
          </Link>
        </div>
      </div>
    </section>
  );
}

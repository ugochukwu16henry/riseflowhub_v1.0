import {
  Nav,
  Hero,
  Problem,
  Solution,
  HowItWorks,
  AIPower,
  ForInvestors,
  PlatformFeatures,
  Vision,
  FinalCTA,
  Footer,
} from '@/components/landing';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-text-dark">
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <HowItWorks />
        <AIPower />
        <ForInvestors />
        <PlatformFeatures />
        <Vision />
        <FinalCTA />
        <Footer />
      </main>
    </div>
  );
}

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-dark px-4">
      <div className="max-w-2xl text-center">
        <img src="/Afrilauch_logo.png" alt="AfriLaunch Hub" className="h-20 w-auto object-contain mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-primary mb-2">AfriLaunch Hub</h1>
        <p className="text-xl text-secondary mb-6">From Idea to Impact.</p>
        <p className="text-gray-600 mb-10">
          We help African entrepreneurs turn ideas into websites, apps, and businesses.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 rounded-lg bg-accent text-text-dark font-medium hover:opacity-90 transition"
          >
            Start Your Project
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold text-secondary">
          <Image src="/Afrilauch_logo.png" alt="AfriLaunch Hub" width={36} height={36} className="h-9 w-auto object-contain" />
          <span className="hidden sm:inline">AfriLaunch Hub</span>
        </Link>

        <div className="hidden md:flex md:items-center md:gap-8">
          <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-primary transition">About</Link>
          <Link href="/team" className="text-sm font-medium text-gray-600 hover:text-primary transition">Team</Link>
          <a href="/#solution" className="text-sm font-medium text-gray-600 hover:text-primary transition">How it works</a>
          <Link href="/investors" className="text-sm font-medium text-gray-600 hover:text-primary transition">Investors</Link>
          <a href="/#features" className="text-sm font-medium text-gray-600 hover:text-primary transition">Features</a>
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-primary transition">Login</Link>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Launch My Idea
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link href="/about" className="text-sm font-medium text-gray-700" onClick={() => setOpen(false)}>About</Link>
            <Link href="/team" className="text-sm font-medium text-gray-700" onClick={() => setOpen(false)}>Team</Link>
            <Link href="/pricing" className="text-sm font-medium text-gray-700" onClick={() => setOpen(false)}>Pricing</Link>
            <a href="/#solution" className="text-sm font-medium text-gray-700" onClick={() => setOpen(false)}>How it works</a>
            <Link href="/investors" className="text-sm font-medium text-gray-700" onClick={() => setOpen(false)}>Investors</Link>
            <a href="/#features" className="text-sm font-medium text-gray-700" onClick={() => setOpen(false)}>Features</a>
            <Link href="/login" className="text-sm font-medium text-gray-700" onClick={() => setOpen(false)}>Login</Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-white"
              onClick={() => setOpen(false)}
            >
              Launch My Idea
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

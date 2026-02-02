import { type ReactNode } from 'react';

interface SectionProps {
  id?: string;
  className?: string;
  children: ReactNode;
  /** Light (default) or dark background */
  variant?: 'default' | 'dark' | 'muted';
}

export function Section({ id, className = '', children, variant = 'default' }: SectionProps) {
  const bg =
    variant === 'dark'
      ? 'bg-secondary text-white'
      : variant === 'muted'
        ? 'bg-gray-50/80 text-text-dark'
        : 'bg-white text-text-dark';

  return (
    <section id={id} className={`py-16 md:py-24 ${bg} ${className}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

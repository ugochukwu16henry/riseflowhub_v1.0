'use client';

import { useEffect, useState } from 'react';
import { api, type SocialMediaLink } from '@/lib/api';

interface SocialLinksBarProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md';
  align?: 'left' | 'center' | 'right';
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E1306C',
  linkedin: '#0A66C2',
  twitter: '#1DA1F2',
  x: '#111111',
  youtube: '#FF0000',
  tiktok: '#000000',
  pinterest: '#E60023',
  whatsapp: '#25D366',
};

export function SocialLinksBar({ variant = 'light', size = 'md', align = 'center' }: SocialLinksBarProps) {
  const [links, setLinks] = useState<SocialMediaLink[]>([]);

  useEffect(() => {
    api.socialLinks
      .list()
      .then(setLinks)
      .catch(() => setLinks([]));
  }, []);

  if (!links.length) return null;

  const textColor = variant === 'dark' ? 'text-gray-100' : 'text-gray-600';
  const justify =
    align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';
  const iconSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';

  return (
    <div className={`flex items-center gap-3 ${justify}`}>
      <span className={`text-xs font-medium ${textColor}`}>Follow us</span>
      <div className="flex items-center gap-2">
        {links.map((link) => {
          const key = link.platformName.toLowerCase();
          const color = PLATFORM_COLORS[key] || '#0FA958';
          const label = link.platformName;
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => api.socialLinks.trackClick(link.id)}
              className="group inline-flex items-center justify-center rounded-full bg-white/90 shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5"
              aria-label={label}
            >
              <span
                className={`${iconSize} flex items-center justify-center rounded-full border border-gray-200 text-xs font-bold`}
                style={{ color, borderColor: `${color}40`, backgroundColor: `${color}08` }}
              >
                {label.charAt(0)}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}


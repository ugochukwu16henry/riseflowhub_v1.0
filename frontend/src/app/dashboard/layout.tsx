'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { getStoredToken, clearStoredToken, api, type User } from '@/lib/api';

const clientNav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/mentor', label: 'AI Mentor' },
  { href: '/dashboard/project', label: 'Project' },
  { href: '/dashboard/startup', label: 'Publish to Marketplace' },
  { href: '/dashboard/marketing', label: 'Marketing' },
  { href: '/dashboard/tasks', label: 'Tasks' },
  { href: '/dashboard/files', label: 'Files' },
  { href: '/dashboard/messages', label: 'Messages' },
  { href: '/dashboard/payments', label: 'Payments' },
  { href: '/dashboard/reports', label: 'Reports' },
];

const adminNav = [
  { href: '/dashboard/admin', label: 'Dashboard' },
  { href: '/dashboard/admin/projects', label: 'Projects' },
  { href: '/dashboard/marketing', label: 'Marketing' },
  { href: '/dashboard/admin/tenants', label: 'Tenants' },
  { href: '/dashboard/admin/users', label: 'Users' },
  { href: '/dashboard/admin/agreements', label: 'Agreements' },
  { href: '/dashboard/admin/startups', label: 'Startup approvals' },
  { href: '/dashboard/admin/reports', label: 'Reports' },
  { href: '/dashboard/admin/settings', label: 'Settings' },
];

const investorNav = [
  { href: '/dashboard/investor', label: 'Dashboard' },
  { href: '/dashboard/investor/marketplace', label: 'Marketplace' },
  { href: '/dashboard/investor/investments', label: 'My investments' },
];

function isAdmin(role: string) {
  return ['super_admin', 'project_manager', 'finance_admin'].includes(role);
}

function isInvestor(role: string) {
  return role === 'investor';
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    api.auth.me(token).then(setUser).catch(() => {
      clearStoredToken();
      router.replace('/login');
    }).finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    const token = getStoredToken();
    if (token) api.auth.logout(token).catch(() => {});
    clearStoredToken();
    router.replace('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex bg-background text-text-dark">
        <aside className="w-56 flex-shrink-0 border-r border-gray-200 bg-white min-h-screen animate-pulse-subtle" />
        <main className="flex-1 flex items-center justify-center p-6">
          <p className="text-secondary text-sm">Loading...</p>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const nav = isAdmin(user.role) ? adminNav : isInvestor(user.role) ? investorNav : clientNav;
  const base = isAdmin(user.role) ? '/dashboard/admin' : isInvestor(user.role) ? '/dashboard/investor' : '/dashboard';
  const primaryColor = user.tenant?.primaryColor || '#6366f1';
  const brandName = user.tenant?.orgName || 'AfriLaunch Hub';
  const logoUrl = user.tenant?.logo || '/Afrilauch_logo.png';

  return (
    <div
      className="min-h-screen flex bg-background text-text-dark"
      style={{ ['--tenant-primary' as string]: primaryColor }}
    >
      <aside className="w-56 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col min-h-screen">
        <div className="p-4 border-b border-gray-100">
          <Link href={base} className="flex items-center gap-2 text-lg font-bold" style={{ color: primaryColor }}>
            <Image src={logoUrl} alt={brandName} width={32} height={32} className="h-8 w-auto object-contain" unoptimized={logoUrl.startsWith('http')} />
            <span>{brandName}</span>
          </Link>
        </div>
        <nav className="p-2 space-y-0.5 flex-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === item.href
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={pathname === item.href ? { backgroundColor: `${primaryColor}20`, color: primaryColor } : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
          <p className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 text-sm text-gray-500 hover:underline"
            style={{ color: primaryColor }}
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}

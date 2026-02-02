'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getStoredToken, clearStoredToken, api, type User } from '@/lib/api';

const clientNav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/project', label: 'Project' },
  { href: '/dashboard/tasks', label: 'Tasks' },
  { href: '/dashboard/files', label: 'Files' },
  { href: '/dashboard/messages', label: 'Messages' },
  { href: '/dashboard/payments', label: 'Payments' },
  { href: '/dashboard/reports', label: 'Reports' },
];

const adminNav = [
  { href: '/dashboard/admin', label: 'Dashboard' },
  { href: '/dashboard/admin/projects', label: 'Projects' },
  { href: '/dashboard/admin/users', label: 'Users' },
  { href: '/dashboard/admin/agreements', label: 'Agreements' },
  { href: '/dashboard/admin/reports', label: 'Reports' },
  { href: '/dashboard/admin/settings', label: 'Settings' },
];

function isAdmin(role: string) {
  return ['super_admin', 'project_manager', 'finance_admin'].includes(role);
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-secondary">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const nav = isAdmin(user.role) ? adminNav : clientNav;
  const base = isAdmin(user.role) ? '/dashboard/admin' : '/dashboard';

  return (
    <div className="min-h-screen flex bg-background text-text-dark">
      <aside className="w-56 flex-shrink-0 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-100">
          <Link href={base} className="text-lg font-bold text-primary">AfriLaunch Hub</Link>
        </div>
        <nav className="p-2 space-y-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === item.href
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
          <p className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 text-sm text-gray-500 hover:text-primary"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}

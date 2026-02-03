'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getStoredToken, clearStoredToken, api, type User } from '@/lib/api';
import { SetupModal } from '@/components/dashboard/SetupModal';

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
  { href: '/dashboard/team', label: 'Team Dashboard' },
  { href: '/dashboard/mentor', label: 'AI Mentor' },
  { href: '/dashboard/admin/leads', label: 'Leads' },
  { href: '/dashboard/admin/projects', label: 'Projects' },
  { href: '/dashboard/marketing', label: 'Marketing' },
  { href: '/dashboard/admin/tenants', label: 'Tenants' },
  { href: '/dashboard/admin/users', label: 'Users' },
  { href: '/dashboard/admin/agreements', label: 'Agreements' },
  { href: '/dashboard/admin/startups', label: 'Startup approvals' },
  { href: '/dashboard/admin/reports', label: 'Reports' },
  { href: '/dashboard/admin/settings', label: 'Settings' },
];

const superAdminNav = [
  { href: '/dashboard/admin', label: 'Dashboard Overview' },
  { href: '/dashboard/team', label: 'Team Dashboard' },
  { href: '/dashboard/admin/users', label: 'Users' },
  { href: '/dashboard/admin/leads', label: 'Leads' },
  { href: '/dashboard/admin/projects', label: 'Ideas & Projects' },
  { href: '/dashboard/admin/milestones', label: 'Milestones' },
  { href: '/dashboard/tasks', label: 'Tasks' },
  { href: '/dashboard/admin/investors', label: 'Investors' },
  { href: '/dashboard/admin/startups', label: 'Startup Marketplace' },
  { href: '/dashboard/admin/agreements', label: 'Agreements' },
  { href: '/dashboard/admin/payments', label: 'Payments' },
  { href: '/dashboard/admin/subscriptions', label: 'Subscriptions' },
  { href: '/dashboard/admin/consultations', label: 'Consultations' },
  { href: '/dashboard/notifications', label: 'Notifications' },
  { href: '/dashboard/mentor', label: 'AI Evaluations' },
  { href: '/dashboard/marketing', label: 'Marketing Campaigns' },
  { href: '/dashboard/admin/analytics', label: 'Analytics' },
  { href: '/dashboard/admin/audit-logs', label: 'Audit Logs' },
  { href: '/dashboard/admin/team', label: 'Team Management' },
  { href: '/dashboard/admin/reports', label: 'Reports' },
  { href: '/dashboard/admin/settings', label: 'Settings' },
];

const teamMemberNav = [
  { href: '/dashboard/team', label: 'Team Dashboard' },
  { href: '/dashboard/mentor', label: 'AI Mentor' },
  { href: '/dashboard/tasks', label: 'Tasks' },
  { href: '/dashboard/files', label: 'Files' },
  { href: '/dashboard/messages', label: 'Messages' },
  { href: '/dashboard/notifications', label: 'Notifications' },
];

const investorNav = [
  { href: '/dashboard/investor', label: 'Dashboard' },
  { href: '/dashboard/mentor', label: 'AI Mentor' },
  { href: '/dashboard/investor/marketplace', label: 'Marketplace' },
  { href: '/dashboard/investor/investments', label: 'My investments' },
];

function isAdmin(role: string) {
  return ['super_admin', 'project_manager', 'finance_admin'].includes(role);
}

function isTeamMember(role: string) {
  return ['super_admin', 'project_manager', 'finance_admin', 'developer', 'designer', 'marketer'].includes(role);
}

function isInvestor(role: string) {
  return role === 'investor';
}

function needsSetupModal(user: User): boolean {
  if (user.setupPaid) return false;
  if (user.role !== 'client' && user.role !== 'investor') return false;
  return !user.setupReason;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  // After payment redirect: verify and refresh user
  useEffect(() => {
    const token = getStoredToken();
    const ref = searchParams.get('ref');
    const success = searchParams.get('setup_success');
    if (!token || !ref || success !== '1') return;
    api.setupFee.verify({ reference: ref }, token)
      .then((r) => {
        if (r.setupPaid) api.auth.me(token!).then(setUser);
      })
      .catch(() => {})
      .finally(() => router.replace(pathname?.split('?')[0] || '/dashboard'));
  }, [searchParams, pathname, router]);

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

  const nav =
    user.role === 'super_admin'
      ? superAdminNav
      : isAdmin(user.role)
        ? adminNav
        : isTeamMember(user.role)
          ? teamMemberNav
          : isInvestor(user.role)
            ? investorNav
            : clientNav;
  const base =
    user.role === 'super_admin'
      ? '/dashboard/admin'
      : isAdmin(user.role)
        ? '/dashboard/admin'
        : isTeamMember(user.role)
          ? '/dashboard/team'
          : isInvestor(user.role)
            ? '/dashboard/investor'
            : '/dashboard';
  const primaryColor = user.tenant?.primaryColor || '#0FA958';
  const brandName = user.tenant?.orgName || 'AfriLaunch Hub';
  const logoUrl = user.tenant?.logo || '/Afrilauch_logo.png';
  const showSetupModal = needsSetupModal(user);
  const showWelcomePanel = isTeamMember(user.role) && user.welcomePanelSeen === false;

  function handleSetupComplete(updated: User) {
    setUser(updated);
  }

  async function dismissWelcomePanel() {
    const token = getStoredToken();
    if (!token) return;
    try {
      await api.users.updateMe({ welcomePanelSeen: true }, token);
      setUser((u) => (u ? { ...u, welcomePanelSeen: true } : u));
    } catch {
      // ignore
    }
  }

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
          {nav.map((item) => {
            const showLocked = !user.setupPaid && (user.role === 'client' || user.role === 'investor');
            const locked = showLocked && isLockedNavItem(item.href, user.role);
            return (
              <span key={item.href} className="relative block group">
                {locked ? (
                  <span
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
                    title="Unlock by completing setup payment"
                  >
                    {item.label}
                    <span className="ml-1.5 inline-block text-amber-500" title="Unlock by completing setup payment">🔒</span>
                  </span>
                ) : (
                  <Link
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
                )}
                {locked && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-1 px-2 py-1.5 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 whitespace-nowrap">
                    Unlock by completing setup payment
                  </div>
                )}
              </span>
            );
          })}
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
      {showSetupModal && (
        <SetupModal
          user={user}
          onComplete={(updated) => {
            api.auth.me(getStoredToken()!).then(setUser);
          }}
          primaryColor={primaryColor}
        />
      )}
      {showWelcomePanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Welcome">
          <div className="max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
            <h2 className="text-xl font-bold text-secondary mb-4">Welcome to the Venture Builder Platform</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              You are not just joining a team — you are helping build startups, systems, and opportunities from the ground up. Early contributors grow into leadership roles as the platform scales.
            </p>
            <button
              type="button"
              onClick={dismissWelcomePanel}
              className="w-full rounded-xl py-3 px-4 font-semibold text-white hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              Get started
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function isLockedNavItem(href: string, role: string): boolean {
  const clientLocked = ['/dashboard/mentor', '/dashboard/startup', '/dashboard/marketing'];
  const investorLocked = ['/dashboard/mentor', '/dashboard/investor/marketplace'];
  if (role === 'client') return clientLocked.some((p) => href === p || href.startsWith(p + '/'));
  if (role === 'investor') return investorLocked.some((p) => href === p || href.startsWith(p + '/'));
  return false;
}

'use client';

import { useEffect, useState } from 'react';
import { api, getStoredToken, type User, type SecurityOverview, type SecurityEventItem, type BlockedIpRow } from '@/lib/api';

export default function SecurityDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [events, setEvents] = useState<SecurityEventItem[]>([]);
  const [blockedIps, setBlockedIps] = useState<BlockedIpRow[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.auth
      .me(token)
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    Promise.all([
      api.superAdmin.security.overview(token).catch(() => null),
      api.superAdmin.security.events(token, {
        severity: severityFilter || undefined,
        limit: 100,
      }).catch(() => ({ items: [] as SecurityEventItem[] })),
      api.superAdmin.security.blockedIps(token).catch(() => ({ items: [] as BlockedIpRow[] })),
    ])
      .then(([ov, ev, blocked]) => {
        setOverview(ov);
        setEvents(ev?.items ?? []);
        setBlockedIps(blocked?.items ?? []);
      })
      .catch(() => {
        setError('Unable to load security data right now.');
      })
      .finally(() => setLoading(false));
  }, [severityFilter]);

  const isSuperAdmin = user?.role === 'super_admin';

  const handleUnblock = async (id: string) => {
    const token = getStoredToken();
    if (!token) return;
    try {
      await api.superAdmin.security.unblockIp(id, token);
      setBlockedIps((rows) => rows.filter((r) => r.id !== id));
    } catch {
      // best-effort; keep UI unchanged on failure
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-secondary mb-4">Security</h1>
        <p className="text-gray-600">Only Super Admins can view the Security Dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-secondary mb-2">Security & Threat Protection</h1>
        <p className="text-gray-600">
          Multi-layer view of suspicious activity, blocked IPs, and automated protections.
        </p>
      </div>

      {loading && <div className="p-6 rounded-xl border border-gray-200 bg-white">Loading security data…</div>}
      {error && !loading && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>
      )}

      {overview && (
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Events (last 24h)" value={overview.eventsLast24h} />
          <MetricCard label="Events (last 7 days)" value={overview.eventsLast7d} />
          <MetricCard label="Active blocked IPs" value={overview.blockedActive} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr,1.4fr]">
        <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-secondary">Recent security events</h2>
              <p className="text-xs text-gray-500">
                Login failures, rate limits, auto-blocks and other suspicious activity.
              </p>
            </div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700"
            >
              <option value="">All severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Time</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Type</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Severity</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">User</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">IP</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Details</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                      No recent security events.
                    </td>
                  </tr>
                ) : (
                  events.map((e) => (
                    <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-3 py-2 text-gray-600">
                        {new Date(e.createdAt).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{e.type}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            e.severity === 'critical'
                              ? 'bg-red-100 text-red-700'
                              : e.severity === 'high'
                              ? 'bg-orange-100 text-orange-700'
                              : e.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {e.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {e.user ? e.user.email || e.user.name || e.user.id : '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{e.ip ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-600 truncate max-w-xs">{e.message}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-secondary">Blocked IPs</h2>
              <p className="text-xs text-gray-500">
                Automatically and manually blocked sources. Unblock only when safe.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-3 py-2 text-left font-medium text-gray-600">IP</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Reason</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Source</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Blocked at</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Expires</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {blockedIps.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                      No active blocked IPs.
                    </td>
                  </tr>
                ) : (
                  blockedIps.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-3 py-2 font-mono text-xs text-gray-800">{row.ip}</td>
                      <td className="px-3 py-2 text-gray-700">{row.reason ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{row.source}</td>
                      <td className="px-3 py-2 text-gray-600">
                        {new Date(row.blockedAt).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {row.expiresAt
                          ? new Date(row.expiresAt).toLocaleString(undefined, {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : 'No expiry'}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => handleUnblock(row.id)}
                          className="rounded-full border border-gray-300 px-2 py-0.5 text-[11px] font-medium text-gray-700 hover:border-primary hover:text-primary"
                        >
                          Unblock
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-blue-50 bg-blue-50/60 px-4 py-3 text-xs text-blue-900">
        <p className="font-semibold mb-1">User-facing safety messaging</p>
        <p>
          When suspicious behaviour is detected, end-users see a calm safety notice like:{' '}
          <span className="italic">
            &quot;Unusual activity has been detected from this session. If this is not you, please secure your
            account. Continued suspicious activity may result in access restrictions.&quot;
          </span>
        </p>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-xl font-semibold text-secondary">{value}</p>
    </div>
  );
}


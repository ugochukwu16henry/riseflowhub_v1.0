'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type User, type UserFeatureState } from '@/lib/api';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [featureState, setFeatureState] = useState<UserFeatureState | null>(null);
  const [featureLoading, setFeatureLoading] = useState(false);
  const [me, setMe] = useState<User | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.auth
      .me(token)
      .then(setMe)
      .catch(() => setMe(null));
    fetch('/api/v1/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  function handleSelectUser(row: UserRow) {
    const token = getStoredToken();
    if (!token) return;
    setSelectedUser(row);
    setFeatureLoading(true);
    setFeatureState(null);
    api.superAdmin
      .userFeatures(row.id, token)
      .then(setFeatureState)
      .catch(() => setFeatureState(null))
      .finally(() => setFeatureLoading(false));
  }

  const canViewFeatures = me?.role === 'super_admin';

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Users</h1>
      <p className="text-gray-600 mb-6 text-sm">
        View all users, their roles, and (for Super Admin) a snapshot of feature access and payment-based unlocks.
      </p>
      <div className="grid gap-4 lg:grid-cols-[2fr,minmax(0,1.2fr)] items-start">
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  {canViewFeatures && (
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Feature access</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={canViewFeatures ? 4 : 3} className="px-4 py-8 text-center text-gray-500">
                      No users
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-100 hover:bg-gray-50/50 cursor-pointer"
                      onClick={() => canViewFeatures && handleSelectUser(u)}
                    >
                      <td className="px-4 py-3 font-medium text-text-dark">{u.name}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3 capitalize text-primary">{u.role.replace('_', ' ')}</td>
                      {canViewFeatures && (
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {selectedUser?.id === u.id && featureLoading && 'Loading…'}
                          {selectedUser?.id === u.id && !featureLoading && featureState && (
                            <span>
                              {featureState.hasSetupAccess ? 'Setup: unlocked' : 'Setup: locked'} ·{' '}
                              {featureState.hasMarketplaceAccess ? 'Marketplace: unlocked' : 'Marketplace: locked'}
                            </span>
                          )}
                          {(!selectedUser || selectedUser.id !== u.id) && 'Click for details'}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {canViewFeatures && (
          <aside className="rounded-xl border border-gray-200 bg-white p-4 text-sm sticky top-4">
            <h2 className="font-semibold text-secondary mb-2">User feature snapshot</h2>
            {!selectedUser && (
              <p className="text-xs text-gray-500">
                Select a user on the left to see their feature access, payment-related unlocks, and badges.
              </p>
            )}
            {selectedUser && featureLoading && (
              <p className="text-xs text-gray-500">Loading feature state for {selectedUser.email}…</p>
            )}
            {selectedUser && !featureLoading && featureState && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-1">
                  {selectedUser.name} · {selectedUser.email}
                </p>
                <ul className="space-y-1 text-xs">
                  <li>
                    <span className="font-medium text-gray-700">Setup access:</span>{' '}
                    {featureState.hasSetupAccess ? 'Unlocked' : 'Locked'}
                  </li>
                  <li>
                    <span className="font-medium text-gray-700">Marketplace:</span>{' '}
                    {featureState.hasMarketplaceAccess ? 'Unlocked' : 'Locked'}
                  </li>
                  <li>
                    <span className="font-medium text-gray-700">Early Founder:</span>{' '}
                    {featureState.isEarlyFounder ? 'Yes' : 'No'}
                  </li>
                  <li>
                    <span className="font-medium text-gray-700">Donor badge:</span>{' '}
                    {featureState.hasDonorBadge ? 'Yes' : 'No'}
                  </li>
                  <li>
                    <span className="font-medium text-gray-700">Pending manual payment:</span>{' '}
                    {featureState.hasPendingManualPayment ? 'Yes' : 'No'}
                  </li>
                </ul>
                {featureState.hasPendingManualPayment && featureState.pendingManualPayment && (
                  <p className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1">
                    Latest pending: {Number(featureState.pendingManualPayment.amount).toLocaleString()}{' '}
                    {featureState.pendingManualPayment.currency} ({featureState.pendingManualPayment.paymentType})
                  </p>
                )}
                {featureState.badges.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[11px] font-medium text-gray-700 mb-1">Badges</p>
                    <div className="flex flex-wrap gap-1">
                      {featureState.badges.map((b) => (
                        <span
                          key={`${b.badgeName}-${b.dateAwarded}`}
                          className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
                        >
                          {b.badgeName
                            .split('_')
                            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                            .join(' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {featureState.earlyAccess && (
                  <div className="mt-2 border-t border-gray-100 pt-2">
                    <p className="text-[11px] font-medium text-gray-700 mb-1">Early Founder program</p>
                    <p className="text-[11px] text-gray-600">
                      Status: {featureState.earlyAccess.status} · Seat #{featureState.earlyAccess.signupOrder}
                    </p>
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

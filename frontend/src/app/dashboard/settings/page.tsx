'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type StartupScoreResponse } from '@/lib/api';

type Tab = 'profile' | 'security' | 'notifications' | 'account';

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch('/api/v1/settings/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load profile'))))
        .then(setProfile),
      fetch('/api/v1/settings/notifications', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load notifications'))))
        .then(setNotifications),
    ])
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const token = typeof window !== 'undefined' ? getStoredToken() : null;

  async function saveProfile() {
    if (!token || !profile) return;
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      const res = await fetch('/api/v1/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || 'Failed to save profile');
      }
      const updated = await res.json();
      setProfile((prev: any) => ({ ...prev, ...updated }));
      setSuccess('Profile updated');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function saveNotifications() {
    if (!token || !notifications) return;
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      const res = await fetch('/api/v1/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(notifications),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || 'Failed to save notifications');
      }
      const updated = await res.json();
      setNotifications(updated);
      setSuccess('Notification preferences updated');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save notifications');
    } finally {
      setSaving(false);
    }
  }

  if (!token) return null;

  if (loading) {
    return (
      <div className="max-w-3xl">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary mb-2">Settings</h1>
        <p className="text-gray-600">Manage your profile, security, and notifications.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {[
          { id: 'profile', label: 'Profile' },
          { id: 'security', label: 'Account & Security' },
          { id: 'notifications', label: 'Notifications' },
          { id: 'account', label: 'Account deletion' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id as Tab);
              setSuccess(null);
              setError(null);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 text-green-800 px-4 py-2 text-sm">{success}</div>
      )}

      {tab === 'profile' && profile && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => setProfile((p: any) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
              <input
                type="text"
                value={profile.displayName || ''}
                onChange={(e) => setProfile((p: any) => ({ ...p, displayName: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={profile.bio || ''}
              onChange={(e) => setProfile((p: any) => ({ ...p, bio: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job title</label>
              <input
                type="text"
                value={profile.jobTitle || ''}
                onChange={(e) => setProfile((p: any) => ({ ...p, jobTitle: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={profile.website || ''}
                onChange={(e) => setProfile((p: any) => ({ ...p, website: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
              <input
                type="url"
                value={profile.linkedinUrl || ''}
                onChange={(e) => setProfile((p: any) => ({ ...p, linkedinUrl: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Twitter/X</label>
              <input
                type="url"
                value={profile.twitterUrl || ''}
                onChange={(e) => setProfile((p: any) => ({ ...p, twitterUrl: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => setProfile((p: any) => ({ ...p, phone: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={profile.country || ''}
                onChange={(e) => setProfile((p: any) => ({ ...p, country: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <input
              type="text"
              value={profile.timezone || ''}
              onChange={(e) => setProfile((p: any) => ({ ...p, timezone: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g. Africa/Lagos"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </div>
      )}

      {tab === 'notifications' && notifications && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-3 text-sm">
          <h2 className="text-lg font-semibold text-secondary mb-2">Notification preferences</h2>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!notifications.emailNotifications}
              onChange={(e) => setNotifications((n: any) => ({ ...n, emailNotifications: e.target.checked }))}
            />
            <span>Email notifications</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!notifications.inAppNotifications}
              onChange={(e) => setNotifications((n: any) => ({ ...n, inAppNotifications: e.target.checked }))}
            />
            <span>In-app notifications</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!notifications.dealUpdates}
              onChange={(e) => setNotifications((n: any) => ({ ...n, dealUpdates: e.target.checked }))}
            />
            <span>Deal updates</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!notifications.investorMessages}
              onChange={(e) => setNotifications((n: any) => ({ ...n, investorMessages: e.target.checked }))}
            />
            <span>Investor messages</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!notifications.projectAlerts}
              onChange={(e) => setNotifications((n: any) => ({ ...n, projectAlerts: e.target.checked }))}
            />
            <span>Project progress alerts</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!notifications.marketingEmails}
              onChange={(e) => setNotifications((n: any) => ({ ...n, marketingEmails: e.target.checked }))}
            />
            <span>Marketing emails</span>
          </label>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveNotifications}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save notifications'}
            </button>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4 text-sm">
          <h2 className="text-lg font-semibold text-secondary mb-2">Account & Security</h2>
          <p className="text-gray-600">Change your email, password, and manage 2FA.</p>
          <p className="text-xs text-gray-500 mt-2">
            (Security changes are wired to backend endpoints but this UI keeps it minimal; you can expand it later.)
          </p>
        </div>
      )}

      {tab === 'account' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 space-y-4 text-sm">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Account deletion</h2>
          <p className="text-red-700">
            If you request deletion, your account will be marked as <strong>pending deletion</strong> for 14 days. You
            can restore it by cancelling the request during that period.
          </p>
          <button
            type="button"
            onClick={async () => {
              if (!token) return;
              setError(null);
              setSuccess(null);
              try {
                const res = await fetch('/api/v1/settings/delete-request', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ reason: 'temporary_break' }),
                });
                if (!res.ok) throw new Error('Failed to request deletion');
                setSuccess('Deletion requested. Your account is now pending deletion.');
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to request deletion');
              }
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Request account deletion
          </button>
        </div>
      )}
    </div>
  );
}


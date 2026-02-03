'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type NotificationItem } from '@/lib/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.notifications
      .list(token)
      .then((data) => setNotifications(data.notifications ?? []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Notifications</h1>
      <p className="text-gray-600 mb-6">Agreement pending and other in-dashboard notifications.</p>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No notifications</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <li key={n.id} className="px-4 py-3 hover:bg-gray-50/50">
                <p className="font-medium text-secondary">{n.title}</p>
                <p className="text-sm text-gray-500">{new Date(n.createdAt).toLocaleString()}</p>
                {n.link && (
                  <a href={n.link} className="text-sm text-primary font-medium hover:underline mt-1 inline-block">
                    View →
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

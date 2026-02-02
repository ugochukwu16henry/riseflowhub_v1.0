'use client';

import { useEffect, useState } from 'react';
import { getStoredToken } from '@/lib/api';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    fetch('/api/v1/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : [])
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-6">Users</h1>
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
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    No users
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-text-dark">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 capitalize text-primary">{u.role.replace('_', ' ')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

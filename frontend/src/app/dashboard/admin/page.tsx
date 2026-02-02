'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredToken } from '@/lib/api';

interface ProjectSummary {
  id: string;
  projectName: string;
  stage: string;
  progressPercent: number;
  client?: { user?: { name: string } };
}

export default function SuperAdminDashboardPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    fetch('/api/v1/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : [])
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Super Admin Dashboard</h1>
      <p className="text-gray-600 mb-8">Overview of all projects and platform activity.</p>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-8">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-secondary">All projects</h2>
          <Link
            href="/dashboard/admin/projects"
            className="text-sm text-primary font-medium hover:underline"
          >
            View all
          </Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Project</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Stage</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Progress</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No projects yet
                    </td>
                  </tr>
                ) : (
                  projects.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-text-dark">{p.projectName}</td>
                      <td className="px-4 py-3 text-gray-600">{p.client?.user?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-primary">{p.stage}</span>
                      </td>
                      <td className="px-4 py-3">{p.progressPercent}%</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/admin/projects/${p.id}`}
                          className="text-primary font-medium hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/dashboard/admin/leads"
          className="rounded-xl border border-gray-200 bg-white p-6 hover:border-primary/30 transition"
        >
          <h3 className="font-semibold text-secondary mb-1">Leads</h3>
          <p className="text-sm text-gray-500">Track and manage incoming leads</p>
        </Link>
        <Link
          href="/dashboard/admin/agreements"
          className="rounded-xl border border-gray-200 bg-white p-6 hover:border-primary/30 transition"
        >
          <h3 className="font-semibold text-secondary mb-1">Agreements</h3>
          <p className="text-sm text-gray-500">Manage and track signed agreements</p>
        </Link>
        <Link
          href="/dashboard/admin/users"
          className="rounded-xl border border-gray-200 bg-white p-6 hover:border-primary/30 transition"
        >
          <h3 className="font-semibold text-secondary mb-1">Users</h3>
          <p className="text-sm text-gray-500">Clients and team members</p>
        </Link>
        <Link
          href="/dashboard/admin/reports"
          className="rounded-xl border border-gray-200 bg-white p-6 hover:border-primary/30 transition"
        >
          <h3 className="font-semibold text-secondary mb-1">Reports</h3>
          <p className="text-sm text-gray-500">Revenue and activity</p>
        </Link>
      </div>
    </div>
  );
}

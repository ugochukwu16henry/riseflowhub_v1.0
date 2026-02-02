'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredToken } from '@/lib/api';
import type { Project } from '@/lib/api';

export default function ClientDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    fetch('/api/v1/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error('Failed to load')))
      .then(setProjects)
      .catch(() => setError('Could not load projects'))
      .finally(() => setLoading(false));
  }, []);

  const project = projects[0];
  const tasks = project?.tasks ?? [];
  const nextTask = tasks.find((t) => t.status !== 'Done') ?? null;
  const doneCount = tasks.filter((t) => t.status === 'Done').length;
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : project?.progressPercent ?? 0;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Welcome back</h1>
      <p className="text-gray-600 mb-8">
        Here’s an overview of your project and next steps.
      </p>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && (
        <div className="rounded-lg bg-amber-50 text-amber-800 px-4 py-3 mb-6">{error}</div>
      )}

      {!loading && !project && !error && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600 mb-4">You don’t have a project yet.</p>
          <Link
            href="/dashboard/project"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90"
          >
            View project
          </Link>
        </div>
      )}

      {!loading && project && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500 mb-1">Project</p>
              <p className="font-semibold text-secondary">{project.projectName}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500 mb-1">Stage</p>
              <p className="font-semibold text-primary capitalize">{project.stage}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500 mb-1">Progress</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500 mb-1">Next milestone</p>
              <p className="font-semibold text-text-dark truncate">
                {nextTask ? nextTask.title : '—'}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
            <h2 className="text-lg font-semibold text-secondary mb-3">Team assigned</h2>
            <p className="text-gray-600 text-sm">
              {project.client?.user?.name
                ? `Contact: ${project.client.user.name} (${project.client.user.email})`
                : 'Your team will be shown here once assigned.'}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard/project"
              className="rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90"
            >
              Project details
            </Link>
            <Link
              href="/dashboard/tasks"
              className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
            >
              View tasks
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

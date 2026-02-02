'use client';

import { useEffect, useState } from 'react';
import { getStoredToken } from '@/lib/api';
import type { Project, Task } from '@/lib/api';

const columns = ['Todo', 'InProgress', 'Done', 'Blocked'];

export default function TasksPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    fetch('/api/v1/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : [])
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  const project = projects[0];
  const tasks: Task[] = project?.tasks ?? [];

  const byStatus = (status: string) => tasks.filter((t) => t.status === status);

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!project) return <p className="text-gray-600">No project yet.</p>;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-secondary mb-6">Tasks</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => (
          <div key={col} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
            <h2 className="font-semibold text-secondary mb-3 capitalize">
              {col === 'InProgress' ? 'In Progress' : col}
            </h2>
            <div className="space-y-2">
              {byStatus(col).length === 0 ? (
                <p className="text-sm text-gray-400">None</p>
              ) : (
                byStatus(col).map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-gray-200 bg-white p-3 text-sm"
                  >
                    <p className="font-medium text-text-dark">{t.title}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {t.assignedTo?.name ?? 'Unassigned'} ·{' '}
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

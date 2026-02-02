'use client';

import { useEffect, useState } from 'react';
import { getStoredToken } from '@/lib/api';
import type { Project } from '@/lib/api';

export default function ProjectDetailsPage() {
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
  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!project) return <p className="text-gray-600">No project yet.</p>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Project details</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded text-sm font-medium bg-primary/10 text-primary capitalize">
            {project.stage}
          </span>
        </div>
        <p className="text-gray-600">{project.description || 'No description.'}</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Start:</span>{' '}
            {project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}
          </div>
          <div>
            <span className="text-gray-500">Deadline:</span>{' '}
            {project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'}
          </div>
          <div>
            <span className="text-gray-500">Progress:</span> {project.progressPercent}%
          </div>
        </div>
      </div>
    </div>
  );
}

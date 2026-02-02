'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredToken, api } from '@/lib/api';
import type { Project, AssignedToMe } from '@/lib/api';

export default function ClientDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [agreements, setAgreements] = useState<AssignedToMe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signModal, setSignModal] = useState<AssignedToMe | null>(null);
  const [signAgreed, setSignAgreed] = useState(false);
  const [signatureText, setSignatureText] = useState('');
  const [signError, setSignError] = useState('');
  const [signSuccess, setSignSuccess] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    Promise.all([
      fetch('/api/v1/projects', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.ok ? res.json() : Promise.reject(new Error('Failed to load')))
        .then(setProjects)
        .catch(() => setError('Could not load projects')),
      api.agreements.listAssignedToMe(token).then(setAgreements).catch(() => setAgreements([])),
    ]).finally(() => setLoading(false));
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

          {/* Agreements to Sign */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 mt-6">
            <h2 className="text-lg font-semibold text-secondary mb-3">Agreements to Sign</h2>
            {agreements.length === 0 ? (
              <p className="text-gray-500 text-sm">No agreements assigned to you.</p>
            ) : (
              <ul className="space-y-2">
                {agreements.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
                    <div>
                      <p className="font-medium text-text-dark">{a.agreement.title}</p>
                      <p className="text-sm text-gray-500">{a.agreement.type}</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.status === 'Signed' ? 'bg-green-100 text-green-800' : a.status === 'Overdue' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {a.status}
                    </span>
                    {a.status !== 'Signed' && (
                      <button
                        type="button"
                        onClick={() => { setSignModal(a); setSignAgreed(false); setSignatureText(''); setSignError(''); setSignSuccess(false); }}
                        className="rounded-lg bg-primary px-3 py-1.5 text-sm text-white hover:opacity-90"
                      >
                        Read & Sign
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {/* Sign agreement modal */}
      {signModal && (
        <SignAgreementModal
          assignment={signModal}
          onClose={() => setSignModal(null)}
          onSigned={() => {
            setSignSuccess(true);
            setAgreements((prev) => prev.map((a) => (a.id === signModal.id ? { ...a, status: 'Signed' as const } : a)));
          }}
        />
      )}
    </div>
  );
}

function SignAgreementModal({
  assignment,
  onClose,
  onSigned,
}: {
  assignment: AssignedToMe;
  onClose: () => void;
  onSigned: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = getStoredToken();

  // Log "viewed" when modal opens (audit trail)
  useEffect(() => {
    if (token && assignment?.agreement?.id) {
      api.agreements.view(assignment.agreement.id, token).catch(() => {});
    }
  }, [token, assignment?.agreement?.id]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed || !signature.trim() || !token) {
      setError('Please confirm you have read and agree, and enter your full name as signature.');
      return;
    }
    setError('');
    setLoading(true);
    api.agreements
      .sign(assignment.agreement.id, { signatureText: signature.trim() }, token)
      .then(() => {
        onSigned();
        onClose();
      })
      .catch((err) => setError(err.message || 'Failed to sign'))
      .finally(() => setLoading(false));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg max-h-[90vh] overflow-auto">
        <h2 className="text-lg font-semibold text-secondary mb-2">Read & Sign: {assignment.agreement.title}</h2>
        <p className="text-sm text-gray-600 mb-4">Type: {assignment.agreement.type}</p>
        {assignment.agreement.templateUrl ? (
          <p className="text-sm text-gray-600 mb-4">
            <a href={assignment.agreement.templateUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
              Open agreement document (PDF/link)
            </a>
          </p>
        ) : (
          <p className="text-sm text-gray-500 mb-4 italic">No document link. Please confirm you have read the agreement.</p>
        )}
        <form onSubmit={handleSubmit}>
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="rounded border-gray-300" />
            <span className="text-sm">I have read and agree to this agreement.</span>
          </label>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full name (signature)</label>
          <input
            type="text"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Type your full name"
            className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2"
            required
          />
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !agreed || !signature.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit signature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

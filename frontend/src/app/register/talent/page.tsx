'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { setStoredToken, getStoredToken, api } from '@/lib/api';

const SKILL_OPTIONS = [
  'Design', 'Frontend', 'Backend', 'Full Stack', 'Mobile', 'DevOps', 'Data', 'Marketing',
  'Product', 'Sales', 'Content', 'SEO', 'UX/UI', 'QA', 'Other',
];

export default function RegisterTalentPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [customRole, setCustomRole] = useState('');
  const [yearsExperience, setYearsExperience] = useState(5);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [pastProjectTitle, setPastProjectTitle] = useState('');
  const [pastProjects, setPastProjects] = useState<Array<{ title: string; description?: string; url?: string }>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSkill = (s: string) => {
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const addPastProject = () => {
    if (!pastProjectTitle.trim()) return;
    setPastProjects((prev) => [...prev, { title: pastProjectTitle.trim() }]);
    setPastProjectTitle('');
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = getStoredToken();
      const data = await api.talent.apply(
        {
          name: name.trim(),
          email: email.trim(),
          password: password || undefined,
          skills: skills.length ? skills : [customRole || 'Other'],
          customRole: customRole.trim() || undefined,
          yearsExperience,
          portfolioUrl: portfolioUrl.trim() || undefined,
          resumeUrl: resumeUrl.trim() || undefined,
          pastProjects: pastProjects.length ? pastProjects : undefined,
        },
        token ?? undefined
      );
      if (data.token) setStoredToken(data.token);
      router.push('/dashboard/talent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Application failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <Link href="/hiring" className="text-sm text-primary hover:underline mb-4 inline-block">← Back to Hiring</Link>
        <div className="flex justify-center mb-4">
          <Image src="/Afrilauch_logo.png" alt="AfriLaunch Hub" width={120} height={40} className="h-10 w-auto object-contain" />
        </div>
        <h1 className="text-xl font-bold text-primary mb-2 text-center">Join as Talent</h1>
        <p className="text-secondary text-sm mb-6 text-center">Submit your profile for approval. Only approved talents appear in the marketplace.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password (min 6) *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills *</label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((s) => (
                <button key={s} type="button" onClick={() => toggleSkill(s)} className={`rounded-full px-3 py-1 text-xs ${skills.includes(s) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>
                  {s}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Or type custom role" value={customRole} onChange={(e) => setCustomRole(e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Years of experience *</label>
            <input type="number" min={0} max={50} value={yearsExperience} onChange={(e) => setYearsExperience(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio URL</label>
            <input type="url" placeholder="https://..." value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resume/CV URL</label>
            <input type="url" placeholder="https://..." value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Past projects</label>
            <input type="text" placeholder="Project title" value={pastProjectTitle} onChange={(e) => setPastProjectTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPastProject())} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <button type="button" onClick={addPastProject} className="mt-1 text-sm text-primary hover:underline">Add</button>
            {pastProjects.length > 0 && <ul className="mt-1 text-xs text-gray-600">{pastProjects.map((p, i) => <li key={i}>{p.title}</li>)}</ul>}
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit for approval'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-gray-500">
          After approval you can pay the $7 marketplace fee to appear in the marketplace. <Link href="/login" className="text-primary hover:underline">Already have an account?</Link>
        </p>
      </div>
    </div>
  );
}

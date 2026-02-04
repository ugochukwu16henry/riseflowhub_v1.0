'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredToken, api, type TalentProfile } from '@/lib/api';

export default function TalentProfilePage() {
  const [profile, setProfile] = useState<TalentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.talent.profile(token).then(setProfile).catch(() => setProfile(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;
  if (!profile) return <div className="p-6"><p className="text-gray-500">No profile.</p><Link href="/register/talent" className="text-primary hover:underline">Apply as talent</Link></div>;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-3">
        <p><span className="font-medium text-gray-700">Status:</span> {profile.status}</p>
        <p><span className="font-medium text-gray-700">Skills:</span> {profile.skills.join(', ')}</p>
        <p><span className="font-medium text-gray-700">Years experience:</span> {profile.yearsExperience}</p>
        {profile.portfolioUrl && <p><span className="font-medium text-gray-700">Portfolio:</span> <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{profile.portfolioUrl}</a></p>}
        {profile.resumeUrl && <p><span className="font-medium text-gray-700">Resume:</span> <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Link</a></p>}
        {profile.averageRating != null && <p><span className="font-medium text-gray-700">Rating:</span> ★ {profile.averageRating.toFixed(1)} ({profile.ratingCount})</p>}
      </div>
      <Link href="/dashboard/talent" className="mt-4 inline-block text-primary hover:underline">← Dashboard</Link>
    </div>
  );
}

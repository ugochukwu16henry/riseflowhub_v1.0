'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HRTalentsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/admin/hr');
  }, [router]);
  return <div className="p-6">Redirecting to HR dashboard… <Link href="/dashboard/admin/hr">Go to HR</Link></div>;
}

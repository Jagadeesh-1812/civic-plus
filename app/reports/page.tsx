'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Nav from '@/components/ui/Nav';
import Footer from '@/components/ui/Footer';
import { useAuth } from '@/lib/auth-context';
import type { Issue } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-amber-100 text-amber-800',
  verified: 'bg-emerald-100 text-emerald-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-stone-100 text-stone-600',
  rejected: 'bg-red-100 text-red-700',
};

const TYPE_ICONS: Record<string, string> = {
  pothole: '🕳️',
  garbage: '🗑️',
  streetlight: '💡',
  water_leak: '💧',
  other: '📍',
};

export default function MyReportsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/reports');
      return;
    }
    if (user?.id) {
      fetch(`/api/issues?reporter_id=${user.id}`)
        .then((r) => r.json())
        .then(setIssues)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.id, authLoading, user, router]);

  if (authLoading || (!user && !loading)) {
    return (
      <>
        <Nav />
        <main className="pt-14 min-h-screen flex items-center justify-center">
          <p className="text-stone-500">Loading...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="pt-14 min-h-screen bg-stone-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">My reports</h1>
          <p className="text-stone-600 mb-8">Track the civic issues you&apos;ve reported</p>

          {loading ? (
            <p className="text-stone-500">Loading...</p>
          ) : issues.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
              <p className="text-stone-500 mb-4">You haven&apos;t reported any issues yet.</p>
              <Link
                href="/report"
                className="inline-block px-4 py-2 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600"
              >
                Report your first issue
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/issue/${issue.id}`}
                  className="block bg-white rounded-xl border border-stone-200 p-4 hover:border-rose-200 transition"
                >
                  <div className="flex gap-4">
                    <img
                      src={issue.image_url}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{TYPE_ICONS[issue.issue_type]}</span>
                        <span className="font-medium text-stone-900 capitalize">
                          {issue.issue_type.replace('_', ' ')}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[issue.status] ?? 'bg-stone-100'}`}
                        >
                          {issue.status.replace('_', ' ')}
                        </span>
                      </div>
                      {issue.description && (
                        <p className="text-sm text-stone-500 truncate mt-0.5">{issue.description}</p>
                      )}
                      <p className="text-xs text-stone-400 mt-1">
                        {new Date(issue.created_at).toLocaleDateString()} • 👍 {issue.confirmations}
                      </p>
                    </div>
                    <span className="text-stone-400">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <Footer />
      </main>
    </>
  );
}

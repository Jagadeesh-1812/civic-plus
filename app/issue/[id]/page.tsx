'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Nav from '@/components/ui/Nav';
import type { Issue } from '@/lib/types';
import type { Vote } from '@/lib/types';

const STATUS_BADGE: Record<string, string> = {
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

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [issue, setIssue] = useState<Issue | null>(null);
  const [userVote, setUserVote] = useState<Vote | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    fetch(`/api/issues/${id}`)
      .then((r) => r.json())
      .then(setIssue)
      .finally(() => setLoading(false));

    fetch(`/api/verify?issue_id=${id}`)
      .then((r) => r.json())
      .then((d) => setUserVote(d.vote));
  }, [id]);

  const handleVote = async (vote: Vote) => {
    if (userVote || voting || !issue) return;
    setVoting(true);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue_id: id, vote }),
      });
      const data = await res.json();
      if (data.id) setIssue(data);
      setUserVote(vote);
    } finally {
      setVoting(false);
    }
  };

  if (loading || !issue) {
    return (
      <>
        <Nav />
        <main className="pt-14 min-h-screen flex items-center justify-center">
          <p className="text-stone-500">{loading ? 'Loading...' : 'Issue not found'}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="pt-14 min-h-screen bg-stone-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link href="/" className="text-rose-600 text-sm font-medium hover:underline mb-4 inline-block">
            ← Back to map
          </Link>

          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="relative aspect-video bg-stone-100">
              <img
                src={issue.image_url}
                alt={issue.description ?? 'Issue'}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[issue.status]}`}>
                  {issue.status.replace('_', ' ')}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-stone-800 text-white">
                  Priority {issue.priority_score}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 text-2xl font-semibold text-stone-900">
                {TYPE_ICONS[issue.issue_type]} {issue.issue_type.replace('_', ' ')}
              </div>
              <p className="text-stone-500 text-sm mt-1 capitalize">{issue.severity} severity</p>

              {issue.description && (
                <p className="mt-4 text-stone-600">{issue.description}</p>
              )}

              <p className="mt-4 text-sm text-stone-500">
                📍 {issue.address ?? `${issue.lat.toFixed(5)}, ${issue.lng.toFixed(5)}`}
              </p>

              <div className="mt-6 flex items-center gap-4">
                <span className="text-sm text-stone-500">
                  👍 {issue.confirmations} confirmations
                </span>
                <span className="text-sm text-stone-500">
                  👎 {issue.rejections} rejections
                </span>
              </div>

              {issue.status !== 'resolved' && (
                <div className="mt-6 pt-4 border-t border-stone-200">
                  <p className="text-sm font-medium text-stone-700 mb-2">Is this issue real?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVote('confirm')}
                      disabled={!!userVote || voting}
                      className={`flex-1 py-2.5 rounded-xl font-medium transition ${
                        userVote === 'confirm'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      } disabled:opacity-70`}
                    >
                      👍 Yes, I confirm
                    </button>
                    <button
                      onClick={() => handleVote('reject')}
                      disabled={!!userVote || voting}
                      className={`flex-1 py-2.5 rounded-xl font-medium transition ${
                        userVote === 'reject'
                          ? 'bg-red-500 text-white'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      } disabled:opacity-70`}
                    >
                      👎 False report
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

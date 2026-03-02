'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Nav from '@/components/ui/Nav';
import { useAuth } from '@/lib/auth-context';
import type { Issue } from '@/lib/types';

interface DashboardStats {
  total: number;
  resolved: number;
  unresolved: number;
  avg_resolution_days: number;
  by_status: Record<string, number>;
  heatmap_data: { lat: number; lng: number; status: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  new: 'text-amber-600',
  verified: 'text-emerald-600',
  in_progress: 'text-blue-600',
  resolved: 'text-stone-500',
  rejected: 'text-red-600',
};

const TYPE_ICONS: Record<string, string> = {
  pothole: '🕳️',
  garbage: '🗑️',
  streetlight: '💡',
  water_leak: '💧',
  other: '📍',
};

export default function DashboardPage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/');
      return;
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then((r) => r.json()),
      fetch('/api/issues').then((r) => r.json()),
    ]).then(([s, i]) => {
      setStats(s);
      setIssues(i);
    }).finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    fetch('/api/dashboard/stats').then((r) => r.json()).then(setStats);
    fetch('/api/issues').then((r) => r.json()).then(setIssues);
  };

  const updateStatus = async (
    id: string,
    status: 'verified' | 'rejected' | 'in_progress' | 'resolved'
  ) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const updated = await res.json();
      setIssues((prev) => prev.map((i) => (i.id === id ? updated : i)));
      refresh();
    } finally {
      setUpdating(null);
    }
  };

  if (authLoading || (!isAdmin && !loading)) {
    return (
      <>
        <Nav />
        <main className="pt-14 min-h-screen flex items-center justify-center">
          <p className="text-stone-500">Loading...</p>
        </main>
      </>
    );
  }

  if (!isAdmin) return null;

  if (loading) {
    return (
      <>
        <Nav />
        <main className="pt-14 min-h-screen flex items-center justify-center">
          <p className="text-stone-500">Loading dashboard...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="pt-14 min-h-screen bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Transparency Dashboard</h1>
          <p className="text-stone-600 mb-8">Track civic issues and resolution progress</p>

          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-sm text-stone-500">Total issues</p>
              <p className="text-2xl font-bold text-stone-900">{stats?.total ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-sm text-stone-500">Resolved</p>
              <p className="text-2xl font-bold text-emerald-600">{stats?.resolved ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-sm text-stone-500">Unresolved</p>
              <p className="text-2xl font-bold text-amber-600">{stats?.unresolved ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-sm text-stone-500">Avg. resolution time</p>
              <p className="text-2xl font-bold text-stone-900">
                {stats?.avg_resolution_days ?? 0} days
              </p>
            </div>
          </div>

          {/* Issues list by priority */}
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <h2 className="px-6 py-4 border-b border-stone-200 font-semibold text-stone-900">
              Pending reports – Accept or reject
            </h2>
            <div className="divide-y divide-stone-100">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex gap-4">
                    <img
                      src={issue.image_url}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{TYPE_ICONS[issue.issue_type]}</span>
                        <span className="font-medium text-stone-900 capitalize">
                          {issue.issue_type.replace('_', ' ')}
                        </span>
                        <span
                          className={`text-sm ${STATUS_COLORS[issue.status] ?? 'text-stone-500'}`}
                        >
                          {issue.status.replace('_', ' ')}
                        </span>
                      </div>
                      {issue.description && (
                        <p className="text-sm text-stone-500 line-clamp-1 mt-0.5">
                          {issue.description}
                        </p>
                      )}
                      <p className="text-xs text-stone-400 mt-1">
                        👍 {issue.confirmations} • 👎 {issue.rejections} • Priority {issue.priority_score}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/issue/${issue.id}`}
                      className="px-3 py-1.5 text-sm text-rose-600 hover:underline"
                    >
                      View
                    </Link>
                    {issue.status === 'new' && (
                      <>
                        <button
                          onClick={() => updateStatus(issue.id, 'verified')}
                          disabled={!!updating}
                          className="px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateStatus(issue.id, 'rejected')}
                          disabled={!!updating}
                          className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {['verified', 'in_progress'].includes(issue.status) && (
                      <>
                        {issue.status !== 'in_progress' && (
                          <button
                            onClick={() => updateStatus(issue.id, 'in_progress')}
                            disabled={!!updating}
                            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                          >
                            In Progress
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(issue.id, 'resolved')}
                          disabled={!!updating}
                          className="px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 disabled:opacity-50"
                        >
                          Resolve
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import IssueMap from '@/components/map/IssueMap';
import Nav from '@/components/ui/Nav';
import Footer from '@/components/ui/Footer';
import type { Issue } from '@/lib/types';

export default function HomePage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<{ resolved: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Issue | null>(null);

  useEffect(() => {
    fetch('/api/issues')
      .then((r) => r.json())
      .then(setIssues)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then((s) => setStats(s));
  }, []);

  const visibleIssues = issues.filter((i) => i.status !== 'rejected');

  return (
    <>
      <Nav />
      <main className="pt-14 min-h-screen">
        <section className="bg-gradient-to-b from-rose-50 to-white border-b border-stone-100">
          <div className="max-w-7xl mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-2">
              Your neighborhood&apos;s heartbeat
            </h1>
            <p className="text-stone-600 mb-4 max-w-xl mx-auto">
              Report civic issues, verify with your community, and track resolution with full transparency.
            </p>
            {stats && (
              <div className="flex justify-center gap-6 text-sm">
                <span className="text-stone-500">
                  <strong className="text-emerald-600">{stats.resolved}</strong> resolved
                </span>
                <span className="text-stone-500">
                  <strong className="text-stone-900">{stats.total}</strong> total reported
                </span>
              </div>
            )}
          </div>
        </section>
        <section className="relative h-[55vh] min-h-[400px]">
          <IssueMap
            issues={visibleIssues}
            onIssueClick={(issue) => setSelected(issue)}
            center={[40.7128, -74.006]}
            zoom={12}
          />
          {selected && (
            <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-xl shadow-lg border border-stone-200 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-stone-900 capitalize">{selected.issue_type.replace('_', ' ')}</p>
                  <p className="text-sm text-stone-500">{selected.status} • Priority {selected.priority_score}</p>
                  {selected.description && (
                    <p className="text-sm text-stone-600 mt-1 line-clamp-2">{selected.description}</p>
                  )}
                </div>
                <Link
                  href={`/issue/${selected.id}`}
                  className="text-rose-600 text-sm font-medium hover:underline"
                >
                  View →
                </Link>
              </div>
            </div>
          )}
        </section>
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-stone-900">
              {loading ? 'Loading...' : `${visibleIssues.length} issues in your area`}
            </h2>
            <div className="flex gap-2">
              <Link
                href="/report"
                className="px-5 py-2.5 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition"
              >
                Report an issue
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockGetIssues, seedDemoData } from '@/lib/mock-store';

export async function GET() {
  if (isSupabaseConfigured()) {
    const { data: issues } = await supabase.from('issues').select('*');
    const stats = computeStats(issues ?? []);
    return NextResponse.json(stats);
  }

  seedDemoData();
  const issues = mockGetIssues();
  const stats = computeStats(issues);
  return NextResponse.json(stats);
}

function computeStats(
  issues: { status: string; created_at: string; resolved_at: string | null; lat: number; lng: number }[]
) {
  const resolved = issues.filter((i) => i.status === 'resolved');
  const unresolved = issues.filter((i) => i.status !== 'resolved');
  const resolvedWithTime = resolved.filter((r) => r.resolved_at);

  const avgResolutionMs =
    resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((acc, r) => {
          const created = new Date(r.created_at).getTime();
          const resolved = new Date(r.resolved_at!).getTime();
          return acc + (resolved - created);
        }, 0) / resolvedWithTime.length
      : 0;

  const avgResolutionDays = Math.round(avgResolutionMs / (1000 * 60 * 60 * 24) * 10) / 10;

  return {
    total: issues.length,
    resolved: resolved.length,
    unresolved: unresolved.length,
    avg_resolution_days: avgResolutionDays,
    by_status: {
      new: issues.filter((i) => i.status === 'new').length,
      verified: issues.filter((i) => i.status === 'verified').length,
      in_progress: issues.filter((i) => i.status === 'in_progress').length,
      resolved: resolved.length,
      rejected: issues.filter((i) => i.status === 'rejected').length,
    },
    heatmap_data: issues.map((i) => ({
      lat: i.lat,
      lng: i.lng,
      status: i.status,
    })),
  };
}

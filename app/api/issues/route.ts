import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockGetIssues, mockCreateIssue, seedDemoData } from '@/lib/mock-store';
import { calculatePriorityScore } from '@/lib/priority';
import type { CreateIssueInput } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const reporterId = searchParams.get('reporter_id');
  const boundsParam = searchParams.get('bounds'); // "sw_lat,sw_lng,ne_lat,ne_lng"

  if (isSupabaseConfigured()) {
    let query = supabase.from('issues').select('*').order('priority_score', { ascending: false });
    if (status) query = query.eq('status', status);
    if (reporterId) query = query.eq('reporter_id', reporterId);
    if (boundsParam) {
      const [swLat, swLng, neLat, neLng] = boundsParam.split(',').map(Number);
      query = query
        .gte('lat', swLat)
        .lte('lat', neLat)
        .gte('lng', swLng)
        .lte('lng', neLng);
    }
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  seedDemoData();
  const bounds = boundsParam
    ? (() => {
        const [swLat, swLng, neLat, neLng] = boundsParam.split(',').map(Number);
        return { sw: [swLat, swLng] as [number, number], ne: [neLat, neLng] as [number, number] };
      })()
    : undefined;
  const issues = mockGetIssues({ status: status as any, bounds, reporter_id: reporterId ?? undefined });
  return NextResponse.json(issues);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateIssueInput;

  const issueData = {
    image_url: body.image_url,
    description: body.description ?? null,
    issue_type: body.issue_type,
    severity: body.severity,
    lat: body.lat,
    lng: body.lng,
    address: body.address ?? null,
    status: 'new' as const,
    reporter_id: body.reporter_id ?? null,
    confirmations: 0,
    rejections: 0,
    location_sensitivity: 0.5,
    resolved_at: null as string | null,
  };

  const priority_score = calculatePriorityScore({
    ...issueData,
    status: 'new',
    created_at: new Date().toISOString(),
  });

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('issues')
      .insert({ ...issueData, priority_score })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  seedDemoData();
  const issue = mockCreateIssue({ ...issueData, priority_score });
  return NextResponse.json(issue);
}

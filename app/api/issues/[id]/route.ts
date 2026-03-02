import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockGetIssue, mockUpdateIssueStatus } from '@/lib/mock-store';
import { requireAdmin } from '@/lib/api-auth';
import type { IssueStatus } from '@/lib/types';

const ADMIN_STATUSES: IssueStatus[] = ['verified', 'rejected', 'in_progress', 'resolved'];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('issues').select('*').eq('id', id).single();
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
  }

  const issue = mockGetIssue(id);
  if (!issue) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(issue);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const status = body.status as IssueStatus;

  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  if (!ADMIN_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    const { createServerSupabaseClient } = await import('@/lib/supabase-server');
    const client = await createServerSupabaseClient();
    const update: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === 'resolved') update.resolved_at = new Date().toISOString();

    const { data, error } = await client
      .from('issues')
      .update(update)
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const issue = mockUpdateIssueStatus(id, status);
  if (!issue) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(issue);
}

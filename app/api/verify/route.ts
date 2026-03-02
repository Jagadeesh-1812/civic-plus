import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockAddVerification, mockGetUserVote } from '@/lib/mock-store';
import type { Vote } from '@/lib/types';

const ANONYMOUS_USER = 'anonymous-demo-user';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { issue_id, vote } = body as { issue_id: string; vote: Vote };

  if (!issue_id || !['confirm', 'reject'].includes(vote)) {
    return NextResponse.json({ error: 'Invalid issue_id or vote' }, { status: 400 });
  }

  const userId = ANONYMOUS_USER; // In production: get from auth

  if (isSupabaseConfigured()) {
    const { data: existing } = await supabase
      .from('verifications')
      .select('id')
      .eq('issue_id', issue_id)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already voted' }, { status: 409 });
    }

    await supabase.from('verifications').insert({ issue_id, user_id: userId, vote });

    const { data: verifications } = await supabase
      .from('verifications')
      .select('vote')
      .eq('issue_id', issue_id);

    const confirmations = verifications?.filter((v) => v.vote === 'confirm').length ?? 0;
    const rejections = verifications?.filter((v) => v.vote === 'reject').length ?? 0;

    const newStatus = confirmations >= 3 && confirmations > rejections ? 'verified' : undefined;
    if (newStatus) {
      await supabase.from('issues').update({ status: newStatus, confirmations, rejections }).eq('id', issue_id);
    } else {
      await supabase.from('issues').update({ confirmations, rejections }).eq('id', issue_id);
    }

    const { data: issue } = await supabase.from('issues').select('*').eq('id', issue_id).single();
    return NextResponse.json(issue);
  }

  const issue = mockAddVerification(issue_id, userId, vote);
  if (!issue) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(issue);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const issue_id = searchParams.get('issue_id');
  if (!issue_id) return NextResponse.json({ error: 'Missing issue_id' }, { status: 400 });

  const userId = ANONYMOUS_USER;

  if (isSupabaseConfigured()) {
    const { data } = await supabase
      .from('verifications')
      .select('vote')
      .eq('issue_id', issue_id)
      .eq('user_id', userId)
      .single();
    return NextResponse.json({ vote: data?.vote ?? null });
  }

  const vote = mockGetUserVote(issue_id, userId);
  return NextResponse.json({ vote });
}

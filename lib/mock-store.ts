/**
 * In-memory mock store for demo when Supabase is not configured
 */

import type { Issue, IssueStatus, Verification, Vote } from './types';
import { calculatePriorityScore } from './priority';

const issues = new Map<string, Issue>();
const verifications = new Map<string, Verification[]>();

function generateId(): string {
  return crypto.randomUUID();
}

export function mockGetIssues(filters?: {
  bounds?: { sw: [number, number]; ne: [number, number] };
  status?: IssueStatus;
  reporter_id?: string;
}): Issue[] {
  let list = Array.from(issues.values());

  if (filters?.reporter_id) {
    list = list.filter((i) => i.reporter_id === filters.reporter_id);
  }
  if (filters?.bounds) {
    const { sw, ne } = filters.bounds;
    list = list.filter(
      (i) => i.lat >= sw[0] && i.lat <= ne[0] && i.lng >= sw[1] && i.lng <= ne[1]
    );
  }
  if (filters?.status) {
    list = list.filter((i) => i.status === filters.status);
  }

  return list.sort((a, b) => b.priority_score - a.priority_score);
}

export function mockGetIssue(id: string): Issue | null {
  return issues.get(id) ?? null;
}

export function mockCreateIssue(data: Omit<Issue, 'id' | 'created_at' | 'updated_at'>): Issue {
  const id = generateId();
  const now = new Date().toISOString();
  const issue: Issue = {
    ...data,
    id,
    created_at: now,
    updated_at: now,
    status: data.status ?? 'new',
    priority_score: data.priority_score ?? 50,
    confirmations: data.confirmations ?? 0,
    rejections: data.rejections ?? 0,
  };
  issue.priority_score = calculatePriorityScore(issue);
  issues.set(id, issue);
  return issue;
}

export function mockUpdateIssueStatus(id: string, status: IssueStatus): Issue | null {
  const issue = issues.get(id);
  if (!issue) return null;
  const updated = {
    ...issue,
    status,
    updated_at: new Date().toISOString(),
    resolved_at: status === 'resolved' ? new Date().toISOString() : null,
  };
  updated.priority_score = calculatePriorityScore(updated);
  issues.set(id, updated);
  return updated;
}

export function mockAddVerification(issueId: string, userId: string, vote: Vote): Issue | null {
  const issue = issues.get(issueId);
  if (!issue) return null;

  const userVerifications = verifications.get(issueId) ?? [];
  const existing = userVerifications.find((v) => v.user_id === userId);
  if (existing) return issue; // Already voted

  const verification: Verification = {
    id: generateId(),
    issue_id: issueId,
    user_id: userId,
    vote,
    created_at: new Date().toISOString(),
  };
  userVerifications.push(verification);
  verifications.set(issueId, userVerifications);

  const confirmations = userVerifications.filter((v) => v.vote === 'confirm').length;
  const rejections = userVerifications.filter((v) => v.vote === 'reject').length;

  const updated: Issue = {
    ...issue,
    confirmations,
    rejections,
    status: confirmations >= 3 && confirmations > rejections ? 'verified' : issue.status,
    updated_at: new Date().toISOString(),
  };
  updated.priority_score = calculatePriorityScore(updated);
  issues.set(issueId, updated);
  return updated;
}

export function mockGetUserVote(issueId: string, userId: string): Vote | null {
  const list = verifications.get(issueId) ?? [];
  const v = list.find((x) => x.user_id === userId);
  return v?.vote ?? null;
}

// Seed demo data
export function seedDemoData(): void {
  if (issues.size > 0) return;

  const now = new Date().toISOString();
  const demoIssues: Partial<Issue>[] = [
    {
      reporter_id: null,
      image_url: 'https://images.unsplash.com/photo-1542224181-5ca4cc359d04?w=400',
      description: 'Large pothole on Main Street causing damage to vehicles',
      issue_type: 'pothole',
      severity: 'high',
      lat: 40.7128,
      lng: -74.006,
      address: 'Main St, New York',
      status: 'verified',
      confirmations: 5,
      rejections: 0,
      location_sensitivity: 0.8,
    },
    {
      reporter_id: null,
      image_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
      description: 'Trash pile near park entrance',
      issue_type: 'garbage',
      severity: 'medium',
      lat: 40.715,
      lng: -74.01,
      address: 'Park Ave, New York',
      status: 'new',
      confirmations: 1,
      rejections: 0,
      location_sensitivity: 0.6,
    },
    {
      reporter_id: null,
      image_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400',
      description: 'Streetlight not working for 2 weeks',
      issue_type: 'streetlight',
      severity: 'medium',
      lat: 40.71,
      lng: -74.008,
      address: '5th Ave, New York',
      status: 'in_progress',
      confirmations: 4,
      rejections: 1,
      location_sensitivity: 0.7,
    },
  ];

  demoIssues.forEach((d, i) => {
    const id = `demo-${i + 1}`;
    const issue: Issue = {
      id,
      reporter_id: d.reporter_id ?? null,
      image_url: d.image_url!,
      description: d.description ?? null,
      issue_type: d.issue_type!,
      severity: d.severity!,
      lat: d.lat!,
      lng: d.lng!,
      address: d.address ?? null,
      status: d.status!,
      priority_score: 50,
      confirmations: d.confirmations ?? 0,
      rejections: d.rejections ?? 0,
      location_sensitivity: d.location_sensitivity ?? 0.5,
      created_at: now,
      updated_at: now,
      resolved_at: null,
    };
    issue.priority_score = calculatePriorityScore(issue);
    issues.set(id, issue);
  });
}

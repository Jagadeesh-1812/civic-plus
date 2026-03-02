import type { Issue, IssueStatus, Severity } from './types';

/**
 * Priority Scoring Engine
 * Computes 0-100 score based on location, severity, time, verifications, status
 */

const SEVERITY_WEIGHTS: Record<Severity, number> = {
  low: 0.3,
  medium: 0.6,
  high: 1.0,
};

const STATUS_BOOST: Record<IssueStatus, number> = {
  new: 0,
  verified: 0.15,
  in_progress: 0.05,
  resolved: 0,
  rejected: 0,
};

const W = { location: 0.2, severity: 0.3, time: 0.2, verification: 0.2, status: 0.1 };

export function calculatePriorityScore(issue: {
  location_sensitivity: number;
  severity: Severity;
  status: IssueStatus;
  created_at: string;
  confirmations: number;
  rejections: number;
}): number {
  const severityScore = SEVERITY_WEIGHTS[issue.severity] ?? 0.6;
  const locationScore = Math.min(1, Math.max(0, issue.location_sensitivity));
  const netVerifications = Math.max(0, issue.confirmations - issue.rejections);
  const verificationScore = Math.min(1, netVerifications / 5);
  const statusBoost = STATUS_BOOST[issue.status] ?? 0;

  const daysUnresolved = (Date.now() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const timeFactor = Math.min(1, Math.log10(daysUnresolved + 1) / 2);

  const raw =
    W.location * locationScore +
    W.severity * severityScore +
    W.time * timeFactor +
    W.verification * verificationScore +
    W.status * (1 + statusBoost);

  return Math.round(Math.min(100, Math.max(0, raw * 100)));
}

export function recalculatePriority(issue: Issue): number {
  return calculatePriorityScore({
    location_sensitivity: issue.location_sensitivity,
    severity: issue.severity,
    status: issue.status,
    created_at: issue.created_at,
    confirmations: issue.confirmations,
    rejections: issue.rejections,
  });
}

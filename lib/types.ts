// CivicPulse type definitions

export type IssueType = 'pothole' | 'garbage' | 'streetlight' | 'water_leak' | 'other';
export type Severity = 'low' | 'medium' | 'high';
export type IssueStatus = 'new' | 'verified' | 'in_progress' | 'resolved' | 'rejected';
export type Vote = 'confirm' | 'reject';
export type UserRole = 'citizen' | 'admin' | 'authority'; // authority = legacy admin

export interface Profile {
  id: string;
  display_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Issue {
  id: string;
  reporter_id: string | null;
  image_url: string;
  description: string | null;
  issue_type: IssueType;
  severity: Severity;
  lat: number;
  lng: number;
  address: string | null;
  status: IssueStatus;
  priority_score: number;
  confirmations: number;
  rejections: number;
  location_sensitivity: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface Verification {
  id: string;
  issue_id: string;
  user_id: string;
  vote: Vote;
  created_at: string;
}

export interface CreateIssueInput {
  image_url: string;
  description?: string;
  issue_type: IssueType;
  severity: Severity;
  lat: number;
  lng: number;
  address?: string;
  reporter_id?: string | null;
}

export interface AIClassificationResult {
  issue_type: IssueType;
  severity: Severity;
}

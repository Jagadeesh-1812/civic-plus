import type { IssueType, Severity, AIClassificationResult } from './types';

/**
 * AI Classification Service
 * Mock implementation for hackathon - swap in Google Vision / TF.js for production
 */

const ISSUE_TYPES: IssueType[] = ['pothole', 'garbage', 'streetlight', 'water_leak', 'other'];
const SEVERITIES: Severity[] = ['low', 'medium', 'high'];

// Keyword hints for text-based classification (NLP-lite)
const TYPE_KEYWORDS: Record<IssueType, string[]> = {
  pothole: ['pothole', 'hole', 'road damage', 'crack', 'bump', 'crater'],
  garbage: ['garbage', 'trash', 'waste', 'debris', 'litter', 'dump'],
  streetlight: ['streetlight', 'street light', 'lamp', 'light', 'dark', 'out'],
  water_leak: ['water', 'leak', 'flood', 'pipe', 'drainage', 'sewer'],
  other: [],
};

function extractTypeFromText(text: string): IssueType | null {
  const lower = text.toLowerCase();
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return type as IssueType;
  }
  return null;
}

/**
 * Mock image classification - returns plausible result based on optional text
 */
export async function classifyImage(
  imageUrl: string,
  textHint?: string
): Promise<AIClassificationResult> {
  // Use text hint if provided for smarter mock
  const textType = textHint ? extractTypeFromText(textHint) : null;
  const issue_type = textType ?? ISSUE_TYPES[hashString(imageUrl) % (ISSUE_TYPES.length - 1)];

  // Severity: use hash for consistency, bias toward medium/high
  const hash = hashString(imageUrl + (textHint ?? ''));
  const severityIndex = hash % 3;
  const severity = SEVERITIES[severityIndex === 0 ? 1 : severityIndex] as Severity;

  // Simulate API delay
  await new Promise((r) => setTimeout(r, 300));

  return { issue_type, severity };
}

/**
 * Classify text description only (fallback when no image)
 */
export function classifyText(text: string): AIClassificationResult {
  const type = extractTypeFromText(text) ?? 'other';
  const hasUrgent = /urgent|critical|danger|emergency|severe|bad/i.test(text);
  const severity: Severity = hasUrgent ? 'high' : 'medium';
  return { issue_type: type, severity };
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

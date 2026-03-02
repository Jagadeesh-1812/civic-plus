import type { UserRole } from './types';

const DEMO_ADMIN_EMAIL = 'admin@civicpulse.demo';
const USER_COOKIE = 'civicpulse_user';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface StoredUser {
  id: string;
  email?: string;
  role: UserRole;
}

export function getRoleFromEmail(email: string): UserRole {
  return email.toLowerCase() === DEMO_ADMIN_EMAIL ? 'admin' : 'citizen';
}

export function setUserCookie(user: StoredUser): void {
  if (typeof document === 'undefined') return;
  const value = encodeURIComponent(JSON.stringify(user));
  document.cookie = `${USER_COOKIE}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearUserCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${USER_COOKIE}=; path=/; max-age=0`;
}

export function getUserFromCookie(cookieValue: string | null | undefined): StoredUser | null {
  if (!cookieValue) return null;
  try {
    return JSON.parse(decodeURIComponent(cookieValue)) as StoredUser;
  } catch {
    return null;
  }
}

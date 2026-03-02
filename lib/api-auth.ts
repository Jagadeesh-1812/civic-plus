import { cookies } from 'next/headers';
import { getUserFromCookie } from './auth-utils';
import { isSupabaseConfigured } from './supabase';
import { createServerSupabaseClient } from './supabase-server';
import type { UserRole } from './types';

/** Get current user role for API routes. Admin-only actions should check isAdmin. */
export async function getApiUser(): Promise<{ id: string; role: UserRole } | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const role = (profile?.role as UserRole) ?? 'citizen';
    return { id: user.id, role };
  }

  const cookieStore = await cookies();
  const user = getUserFromCookie(cookieStore.get('civicpulse_user')?.value);
  return user ? { id: user.id, role: user.role } : null;
}

export async function requireAdmin(): Promise<{ id: string; role: UserRole }> {
  const user = await getApiUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'authority';
  if (!user || !isAdmin) {
    throw new Error('Admin access required');
  }
  return user;
}

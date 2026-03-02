'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import type { User } from '@supabase/supabase-js';
import type { UserRole } from './types';
import { getRoleFromEmail, setUserCookie, clearUserCookie } from './auth-utils';

export interface AppUser {
  id: string;
  email?: string;
  role: UserRole;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USER_KEY = 'civicpulse-demo-user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(() => {
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          const role = (profile?.role as UserRole) ?? 'citizen';
          setUser({
            id: session.user.id,
            email: session.user.email,
            role,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_ev, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          const role = (profile?.role as UserRole) ?? 'citizen';
          setUser({ id: session.user.id, email: session.user.email, role });
        } else {
          setUser(null);
        }
      });
      return () => subscription.unsubscribe();
    } else {
      try {
        const stored = localStorage.getItem(DEMO_USER_KEY);
        const parsed = stored ? JSON.parse(stored) : null;
        setUser(parsed);
        if (parsed) setUserCookie(parsed);
      } catch {
        setUser(null);
      }
      setLoading(false);
      return () => {};
    }
  }, []);

  useEffect(() => loadUser(), [loadUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      const role = (profile?.role as UserRole) ?? 'citizen';
      const appUser: AppUser = { id: data.user.id, email: data.user.email, role };
      setUser(appUser);
    } else {
      const role = getRoleFromEmail(email);
      const appUser: AppUser = { id: `demo-${Date.now()}`, email, role };
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(appUser));
      setUserCookie(appUser);
      setUser(appUser);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      const role = (data.user?.email ? getRoleFromEmail(data.user.email) : 'citizen') as UserRole;
      const appUser: AppUser = { id: data.user!.id, email: data.user?.email, role };
      setUser(appUser);
    } else {
      const role = getRoleFromEmail(email);
      const appUser: AppUser = { id: `demo-${Date.now()}`, email, role };
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(appUser));
      setUserCookie(appUser);
      setUser(appUser);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
      setUser(null);
    } else {
      localStorage.removeItem(DEMO_USER_KEY);
      clearUserCookie();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, isAdmin: user?.role === 'admin' || user?.role === 'authority' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

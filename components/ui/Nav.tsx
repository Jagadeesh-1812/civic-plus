'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Nav() {
  const { user, loading, signOut, isAdmin } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-stone-900">
          <span className="text-xl">❤️</span>
          <span>CivicPulse</span>
          <span className="text-xs font-normal text-stone-500 hidden sm:inline">
            Your neighborhood's heartbeat
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/report"
            className="px-4 py-2 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition"
          >
            Report Issue
          </Link>
          {user && !isAdmin && (
            <Link
              href="/reports"
              className="text-stone-600 hover:text-stone-900 text-sm font-medium"
            >
              My Reports
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/dashboard"
              className="text-stone-600 hover:text-stone-900 text-sm font-medium"
            >
              Admin Dashboard
            </Link>
          )}
          {!loading && (
            user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-500 truncate max-w-[120px]" title={user.role}>
                  {user.email ?? 'Signed in'}
                  {isAdmin && <span className="ml-1 text-rose-600">(Admin)</span>}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-stone-500 hover:text-stone-700"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-stone-600 hover:text-stone-900 text-sm font-medium"
              >
                Sign in
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}

'use client';
import Link from 'next/link';
import { useAuth } from './AuthProvider';

export function NavAuth() {
  const { username, signOut, loading } = useAuth();
  if (loading) return <span className="text-xs text-muted">…</span>;
  if (!username) {
    return (
      <Link href="/login" className="text-muted hover:text-ink">
        Sign in
      </Link>
    );
  }
  return (
    <span className="flex items-center gap-2">
      <span className="text-ink">{username}</span>
      <span className="text-muted">·</span>
      <button
        onClick={() => signOut()}
        className="text-muted hover:text-ink"
        type="button"
      >
        sign out
      </button>
    </span>
  );
}

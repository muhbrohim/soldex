'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { hasSupabase } from '@/lib/supabase';

function LoginInner() {
  const { signIn, user, username } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/';
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (user) {
    return (
      <div className="max-w-sm">
        <p className="text-ink">
          Signed in as <strong>{username}</strong>.
        </p>
        <p className="text-muted text-sm mt-2">
          Use the nav bar to sign out, or go to{' '}
          <Link href="/" className="text-accent">browse</Link>.
        </p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await signIn(u, p);
    setBusy(false);
    if (error) {
      setErr(error);
      return;
    }
    router.replace(next);
  }

  return (
    <div className="max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <p className="text-xs text-muted">
        Invite-only. Ask the owner for a username.
      </p>
      {!hasSupabase && (
        <p className="text-xs text-amber-300 border border-amber-700/60 rounded p-2">
          Auth backend not configured (NEXT_PUBLIC_SUPABASE_URL missing).
        </p>
      )}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted mb-1">
            Username
          </label>
          <input
            value={u}
            onChange={(e) => setU(e.target.value)}
            autoFocus
            autoComplete="username"
            spellCheck={false}
            className="w-full bg-panel border border-line rounded px-3 py-2 outline-none focus:border-accent"
            placeholder="e.g. esa"
            required
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted mb-1">
            Password
          </label>
          <input
            type="password"
            value={p}
            onChange={(e) => setP(e.target.value)}
            autoComplete="current-password"
            className="w-full bg-panel border border-line rounded px-3 py-2 outline-none focus:border-accent"
            required
          />
        </div>
        {err && (
          <p className="text-xs text-rose-400 border border-rose-900/60 rounded p-2">
            {err}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !hasSupabase}
          className="w-full bg-accent text-bg rounded px-3 py-2 font-medium disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <LoginInner />
    </Suspense>
  );
}

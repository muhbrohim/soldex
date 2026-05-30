'use client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, hasSupabase } from '@/lib/supabase';

// Fake-email suffix appended to user-typed usernames.
// `esa` -> `esa@soldex.local`. Keeps the UX username-only while letting
// Supabase Auth's email/password flow do all the work.
export const EMAIL_DOMAIN = '@soldex.local';

export function usernameFromEmail(email: string | undefined): string | null {
  if (!email) return null;
  return email.endsWith(EMAIL_DOMAIN)
    ? email.slice(0, -EMAIL_DOMAIN.length)
    : email;
}

interface AuthCtx {
  user: User | null;
  username: string | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(hasSupabase);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const sub = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => {
      sub.data.subscription.unsubscribe();
    };
  }, []);

  const value: AuthCtx = {
    user: session?.user ?? null,
    username: usernameFromEmail(session?.user?.email),
    loading,
    async signIn(username, password) {
      if (!supabase) return { error: 'Auth backend not configured.' };
      const email = username.trim().toLowerCase() + EMAIL_DOMAIN;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return error ? { error: error.message } : {};
    },
    async signOut() {
      if (!supabase) return;
      await supabase.auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}

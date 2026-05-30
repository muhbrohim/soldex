// Singleton Supabase browser client.
// Returns null when env vars are missing so the app can keep running off
// the bundled JSON fallback (useful pre-migration and in CI builds).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anon ? createClient(url, anon) : null;

export const hasSupabase = !!supabase;

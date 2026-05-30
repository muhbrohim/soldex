'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { useAuth } from '@/components/AuthProvider';
import { supabase, hasSupabase } from '@/lib/supabase';
import { restoreShoe } from '@/lib/mutations';

interface TrashedShoe {
  id: string;
  brand: string;
  version: string;
  deleted_at: string;
}

export default function TrashPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/trash');
  }, [loading, user, router]);

  const { data, error, isLoading } = useSWR(
    user && hasSupabase ? 'trash' : null,
    async () => {
      const { data, error } = await supabase!
        .from('shoes')
        .select('id, brand, version, deleted_at')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TrashedShoe[];
    },
  );

  if (loading || !user) return <p className="text-muted">…</p>;

  async function onRestore(id: string) {
    setBusyId(id);
    try {
      await restoreShoe(id, user?.id ?? null);
      await mutate('trash');
      await mutate((key) => Array.isArray(key) && key[0] === 'shoes');
    } catch (e) {
      alert(`Restore failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <article className="max-w-3xl">
      <h1 className="text-xl font-semibold">Trash</h1>
      <p className="text-muted text-sm mt-1">
        Soft-deleted shoes. Restoring puts them back in browse with all data intact.
      </p>

      {!hasSupabase && (
        <p className="text-xs text-amber-300 border border-amber-700/60 rounded p-2 mt-4">
          Supabase not configured.
        </p>
      )}
      {error && (
        <p className="text-rose-400 mt-4">Failed: {String(error)}</p>
      )}
      {isLoading && <p className="text-muted mt-4">Loading…</p>}
      {data && data.length === 0 && (
        <p className="text-muted mt-4">Empty. Nothing has been deleted.</p>
      )}

      {data && data.length > 0 && (
        <ul className="mt-4 divide-y divide-line border border-line rounded">
          {data.map((s) => (
            <li
              key={s.id}
              className="flex items-baseline justify-between gap-3 p-3 text-sm"
            >
              <div>
                <span className="text-muted text-xs">{s.brand}</span>
                <span className="block text-ink">{s.version}</span>
                <span className="text-xs text-muted">
                  deleted {new Date(s.deleted_at).toLocaleString()}
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/shoe/${s.id}`}
                  className="text-xs px-2 py-1 border border-line rounded text-muted hover:text-ink"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => onRestore(s.id)}
                  disabled={busyId === s.id}
                  className="text-xs px-2 py-1 rounded bg-accent text-bg disabled:opacity-50"
                >
                  {busyId === s.id ? '…' : 'Restore'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

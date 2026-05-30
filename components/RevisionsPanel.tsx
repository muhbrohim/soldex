'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { fetchRevisions, type RevisionRow } from '@/lib/mutations';
import { useAuth } from './AuthProvider';
import { hasSupabase } from '@/lib/supabase';

export function RevisionsPanel({ shoeId }: { shoeId: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { data, error, isLoading } = useSWR(
    user && open && hasSupabase ? ['revisions', shoeId] : null,
    () => fetchRevisions(shoeId),
    { revalidateOnFocus: false },
  );

  if (!user) return null;

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-sm uppercase tracking-wider text-muted hover:text-ink"
      >
        {open ? '▾' : '▸'} Revision history
      </button>
      {open && (
        <div className="mt-2 border border-line rounded">
          {isLoading && <p className="p-3 text-xs text-muted">Loading…</p>}
          {error && (
            <p className="p-3 text-xs text-rose-400">
              Failed: {String(error)}
            </p>
          )}
          {data && data.length === 0 && (
            <p className="p-3 text-xs text-muted">No revisions recorded.</p>
          )}
          {data && data.length > 0 && (
            <ul className="divide-y divide-line/60">
              {data.map((r) => (
                <RevisionItem key={r.id} r={r} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

const OP_LABEL: Record<RevisionRow['op'], string> = {
  insert: 'created',
  update: 'updated',
  delete: 'deleted',
  restore: 'restored',
};

function RevisionItem({ r }: { r: RevisionRow }) {
  const [open, setOpen] = useState(false);
  const at = new Date(r.at).toLocaleString();
  const changed = r.changed ?? [];
  return (
    <li className="p-3 text-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-baseline gap-2 text-left w-full hover:text-ink"
      >
        <span className="text-ink font-mono">{at}</span>
        <span className="text-muted">·</span>
        <span className="text-accent">{OP_LABEL[r.op]}</span>
        {!!changed.length && (
          <span className="text-muted truncate">
            {changed.slice(0, 6).join(', ')}
            {changed.length > 6 ? '…' : ''}
          </span>
        )}
        <span className="ml-auto text-muted">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <pre className="mt-2 text-[10px] text-muted overflow-x-auto whitespace-pre-wrap break-all bg-bg p-2 rounded border border-line">
{JSON.stringify({ before: r.before, after: r.after }, null, 2)}
        </pre>
      )}
    </li>
  );
}

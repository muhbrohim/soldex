'use client';
import Link from 'next/link';
import { useCompare } from '@/store/compare';
import { shoes } from '@/lib/data';

export function CompareBar() {
  const { ids, clear } = useCompare();
  if (!ids.length) return null;
  const items = ids
    .map((id) => shoes.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-panel border border-line rounded-full pl-4 pr-2 py-2 flex items-center gap-3 shadow-lg max-w-[95vw]">
      <span className="text-xs text-muted whitespace-nowrap">
        Compare <span className="text-ink font-medium">{items.length}</span>
      </span>
      <span className="text-xs text-ink truncate">
        {items.map((s) => `${s.brand} ${s.version}`).join(' · ')}
      </span>
      <Link
        href={`/compare?ids=${ids.join(',')}`}
        className="bg-accent text-bg text-xs font-medium px-3 py-1.5 rounded-full hover:opacity-90"
      >
        Compare →
      </Link>
      <button onClick={clear} className="text-muted text-xs hover:text-ink px-2">clear</button>
    </div>
  );
}

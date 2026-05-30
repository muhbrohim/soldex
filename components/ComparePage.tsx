'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import type { Shoe } from '@/lib/types';
import { formatIdr, formatGrams, formatNum, formatMm } from '@/lib/format';
import { useCompare } from '@/store/compare';

const COLORS = ['#7dd3fc', '#fca5a5', '#86efac', '#fcd34d'];

const AXES: { key: keyof Shoe; label: string; max: number }[] = [
  { key: 'her', label: 'HER', max: 85 },
  { key: 'fer', label: 'FER', max: 85 },
  { key: 'hsa', label: 'HSA', max: 170 },
  { key: 'fsa', label: 'FSA', max: 160 },
  { key: 'trac', label: 'TRAC', max: 1 },
  { key: 'mSoft', label: 'm-soft', max: 50 },
];

const DIFF_FIELDS: { key: keyof Shoe; label: string; better: 'higher' | 'lower'; fmt: (n?: number) => string }[] = [
  { key: 'her', label: 'HER %', better: 'higher', fmt: (n) => formatNum(n) },
  { key: 'fer', label: 'FER %', better: 'higher', fmt: (n) => formatNum(n) },
  { key: 'avgEr', label: 'avg ER %', better: 'higher', fmt: (n) => formatNum(n) },
  { key: 'hsa', label: 'HSA', better: 'higher', fmt: (n) => (n == null ? '—' : String(n)) },
  { key: 'fsa', label: 'FSA', better: 'higher', fmt: (n) => (n == null ? '—' : String(n)) },
  { key: 'weightG', label: 'Weight', better: 'lower', fmt: (n) => formatGrams(n) },
  { key: 'priceIdr', label: 'Price', better: 'lower', fmt: (n) => formatIdr(n) },
  { key: 'valueIdx', label: 'value/M', better: 'higher', fmt: (n) => formatNum(n) },
  { key: 'drop', label: 'Drop', better: 'higher', fmt: (n) => formatMm(n) },
  { key: 'heel', label: 'Heel', better: 'higher', fmt: (n) => formatMm(n) },
  { key: 'fore', label: 'Fore', better: 'higher', fmt: (n) => formatMm(n) },
  { key: 'trac', label: 'TRAC', better: 'higher', fmt: (n) => formatNum(n, 2) },
  { key: 'mSoft', label: 'm-soft', better: 'higher', fmt: (n) => formatNum(n) },
  { key: 'flexStiff', label: 'flexStiff', better: 'higher', fmt: (n) => formatNum(n) },
  { key: 'oDurPct', label: 'o-dur%', better: 'higher', fmt: (n) => formatNum(n, 2) },
];

export function ComparePage({ allShoes }: { allShoes: Shoe[] }) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <ComparePageInner allShoes={allShoes} />
    </Suspense>
  );
}

function ComparePageInner({ allShoes }: { allShoes: Shoe[] }) {
  const sp = useSearchParams();
  const compare = useCompare();
  const [copied, setCopied] = useState(false);

  // URL has priority; sync to local store on first load
  const urlIds = useMemo(() => {
    const raw = sp.get('ids');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [sp]);

  useEffect(() => {
    if (urlIds.length) {
      // overwrite store from URL
      useCompare.setState({ ids: urlIds.slice(0, 4) });
    }
  }, [urlIds]);

  const ids = urlIds.length ? urlIds : compare.ids;
  const shoes = ids.map((id) => allShoes.find((s) => s.id === id)).filter((s): s is Shoe => !!s);

  if (!shoes.length) {
    return (
      <div className="text-muted">
        <p>No shoes in your compare cart yet. Go to <Link href="/" className="text-accent">Browse</Link> and tick a few.</p>
      </div>
    );
  }

  const radarData = AXES.map((ax) => {
    const row: Record<string, number | string> = { axis: ax.label };
    shoes.forEach((s) => {
      const v = s[ax.key] as number | undefined;
      row[s.id] = v == null ? 0 : Math.min(1, v / ax.max);
    });
    return row;
  });

  function share() {
    const url = `${location.origin}${location.pathname}?ids=${shoes.map((s) => s.id).join(',')}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold">Compare ({shoes.length})</h1>
        <div className="flex gap-2">
          <button onClick={share} className="text-sm border border-line px-3 py-1.5 rounded hover:bg-panel">
            {copied ? 'Copied!' : 'Copy share link'}
          </button>
          <button onClick={compare.clear} className="text-sm text-muted hover:text-ink px-2">Clear</button>
        </div>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {shoes.map((s, i) => (
          <div key={s.id} className="border border-line rounded p-3 bg-panel">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
              <span className="text-xs text-muted">{s.brand}</span>
            </div>
            <Link href={`/shoe/${s.id}`} className="text-ink hover:underline">{s.version}</Link>
            <div className="text-xs text-muted mt-2 num">
              {formatIdr(s.priceIdr)} · {formatGrams(s.weightG)} · drop {formatMm(s.drop)}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wider text-muted mb-2">Radar (normalized)</h2>
        <div className="border border-line rounded p-2 bg-panel h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#2a2b30" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: '#8a8a93', fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#15161a', border: '1px solid #2a2b30' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {shoes.map((s, i) => (
                <Radar
                  key={s.id}
                  name={`${s.brand} ${s.version}`}
                  dataKey={s.id}
                  stroke={COLORS[i]}
                  fill={COLORS[i]}
                  fillOpacity={0.2}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wider text-muted mb-2">Diff table (best per row highlighted)</h2>
        <div className="overflow-x-auto border border-line rounded">
          <table className="w-full text-sm num">
            <thead className="bg-panel text-muted text-xs">
              <tr>
                <th className="p-2 text-left">Field</th>
                {shoes.map((s) => (
                  <th key={s.id} className="p-2 text-right text-ink">{s.brand} {s.version}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DIFF_FIELDS.map((field) => {
                const vals = shoes.map((s) => s[field.key] as number | undefined);
                const present = vals.filter((v): v is number => v != null);
                const best = present.length
                  ? field.better === 'higher' ? Math.max(...present) : Math.min(...present)
                  : null;
                return (
                  <tr key={field.key as string} className="border-t border-line/60">
                    <td className="p-2 text-muted">{field.label}</td>
                    {shoes.map((s, i) => {
                      const v = vals[i];
                      const isBest = v != null && v === best && present.length > 1;
                      return (
                        <td
                          key={s.id}
                          className={`p-2 text-right ${isBest ? 'text-accent font-medium' : 'text-ink'}`}
                        >
                          {field.fmt(v)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-3">
        {shoes.map((s) => (
          <div key={s.id} className="border border-line rounded p-3 text-sm">
            <div className="text-muted text-xs mb-1">{s.brand} {s.version} · notes</div>
            <p>{[s.minus, s.conclusion, s.reBuy].filter(Boolean).join(' · ') || <span className="text-muted">—</span>}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

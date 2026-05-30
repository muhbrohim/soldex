'use client';
import Link from 'next/link';
import type { Shoe } from '@/lib/types';
import { formatPct } from '@/lib/format';
import { similar, TYPE_LABEL } from '@/lib/derive';
import { useCompare } from '@/store/compare';
import {
  COLUMN_META,
  getField,
  type ColumnKey,
  type ColumnGroup,
} from '@/lib/columns';
import { HeaderTip } from './HeaderTip';

// Which columns to surface per detail-page section.
const SECTIONS: { title: string; group: ColumnGroup; cols: ColumnKey[] }[] = [
  {
    title: 'Energy & shock',
    group: 'energy',
    cols: ['her', 'fer', 'avgEr', 'hsa', 'fsa', 'avgSa', 'herMinusFer'],
  },
  {
    title: 'Feel & stiffness',
    group: 'feel',
    cols: ['mSoft', 'flexStiff', 'torsRigid'],
  },
  {
    title: 'Outsole',
    group: 'outsole',
    cols: ['oDurPct', 'oStay', 'trac'],
  },
  {
    title: 'Geometry — heights',
    group: 'geomHeight',
    cols: ['weightG', 'heel', 'fore', 'drop', 'drem', 'oThick'],
  },
  {
    title: 'Geometry — widths',
    group: 'geomWidth',
    cols: ['mFore', 'width', 'toe', 'upFoam'],
  },
  {
    title: 'Value',
    group: 'value',
    cols: ['priceIdr', 'valueIdx'],
  },
];

export function ShoeDetail({ shoe, all }: { shoe: Shoe; all: Shoe[] }) {
  const sim = similar(shoe, all, 5);
  const sameBrand = all.filter((s) => s.brand === shoe.brand && s.id !== shoe.id).slice(0, 6);
  const sameFoam = shoe.foam
    ? all.filter((s) => s.foam === shoe.foam && s.id !== shoe.id).slice(0, 6)
    : [];
  const compare = useCompare();
  const checked = compare.ids.includes(shoe.id);

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-muted text-sm">{shoe.brand}</p>
          <h1 className="text-3xl font-semibold">{shoe.version}</h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
            {shoe.type && (
              <span className="px-2 py-0.5 bg-panel border border-line rounded">
                {shoe.type} · {TYPE_LABEL[shoe.type] ?? ''}
              </span>
            )}
            {shoe.foam && (
              <span className="px-2 py-0.5 bg-panel border border-line rounded">
                Foam: {shoe.foam}
              </span>
            )}
            {(shoe.categories ?? []).map((c) => (
              <span
                key={c}
                className="px-2 py-0.5 border border-line rounded text-muted"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => compare.toggle(shoe.id)}
            className={`text-sm px-3 py-1.5 rounded border ${
              checked ? 'bg-accent text-bg border-accent' : 'border-line hover:bg-panel'
            }`}
          >
            {checked ? 'In compare ✓' : '+ Add to compare'}
          </button>
          <Link href="/" className="text-sm text-muted hover:text-ink">
            ← Back
          </Link>
        </div>
      </header>

      {SECTIONS.map((sec) => (
        <Group key={sec.group} title={sec.title}>
          {sec.cols.map((k) => {
            const meta = COLUMN_META[k];
            const v = getField(shoe, k);
            const display = meta.format ? meta.format(v) : String(v ?? '—');
            return (
              <Stat
                key={k}
                colKey={k}
                label={meta.label}
                code={meta.code}
                tip={meta.tip}
                value={display}
              />
            );
          })}
        </Group>
      ))}

      {(shoe.minus || shoe.conclusion || shoe.reBuy) && (
        <section>
          <h2 className="text-sm uppercase tracking-wider text-muted mb-2">
            Owner notes
          </h2>
          <div className="bg-panel border border-line rounded p-4 text-sm space-y-2">
            {shoe.minus && (
              <p>
                <span className="text-muted">minus:</span> {shoe.minus}
              </p>
            )}
            {shoe.conclusion && (
              <p>
                <span className="text-muted">conclusion:</span> {shoe.conclusion}
              </p>
            )}
            {shoe.reBuy && (
              <p>
                <span className="text-muted">re-buy:</span> {shoe.reBuy}
              </p>
            )}
          </div>
        </section>
      )}

      <ShoeList title="Similar shoes" items={sim} />
      {!!sameBrand.length && (
        <ShoeList title={`More from ${shoe.brand}`} items={sameBrand} />
      )}
      {!!sameFoam.length && (
        <ShoeList title={`Same foam · ${shoe.foam}`} items={sameFoam} />
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm uppercase tracking-wider text-muted mb-2">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded overflow-hidden">
        {children}
      </div>
    </section>
  );
}

function Stat({
  colKey,
  label,
  code,
  tip,
  value,
}: {
  colKey: ColumnKey;
  label: string;
  code?: string;
  tip: string;
  value: string;
}) {
  return (
    <div className="bg-bg p-3">
      <div className="text-xs text-muted">
        <HeaderTip
          label={label}
          code={code}
          tip={tip}
          learnMoreHref={`/docs/metrics#${colKey}`}
        />
      </div>
      <div className="text-base text-ink num mt-0.5">{value}</div>
    </div>
  );
}

function ShoeList({ title, items }: { title: string; items: Shoe[] }) {
  return (
    <section>
      <h2 className="text-sm uppercase tracking-wider text-muted mb-2">{title}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {items.map((s) => (
          <Link
            key={s.id}
            href={`/shoe/${s.id}`}
            className="border border-line rounded p-3 hover:bg-panel flex items-baseline justify-between"
          >
            <span>
              <span className="text-muted text-xs">{s.brand}</span>
              <span className="block text-sm text-ink">{s.version}</span>
            </span>
            <span className="text-xs text-muted num">{formatPct(s.avgEr, 1)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

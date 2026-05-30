'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Shoe, Meta, Filters } from '@/lib/types';
import { EMPTY_FILTERS } from '@/lib/types';
import { applyFilters, sortShoes, type SortKey } from '@/lib/filter';
import { useCompare, MAX_COMPARE } from '@/store/compare';
import { TYPE_LABEL } from '@/lib/derive';
import {
  ALL_COLUMNS,
  COLUMN_META,
  DEFAULT_VISIBLE,
  getField,
  type ColumnKey,
} from '@/lib/columns';
import { computeThresholds, getBandLabel } from '@/lib/bands';
import { HeaderTip } from './HeaderTip';
import { ColumnPicker, loadVisibleColumns } from './ColumnPicker';

export function BrowseView({ shoes, meta }: { shoes: Shoe[]; meta: Meta }) {
  const [f, setF] = useState<Filters>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>('avgEr');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [visible, setVisible] = useState<ColumnKey[]>(DEFAULT_VISIBLE);
  const compare = useCompare();

  // hydrate visible cols from localStorage after mount (SSR-safe)
  useEffect(() => {
    setVisible(loadVisibleColumns());
  }, []);

  const filtered = useMemo(() => applyFilters(shoes, f), [shoes, f]);
  const rows = useMemo(
    () => sortShoes(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir],
  );
  const visibleCols = useMemo(
    () => ALL_COLUMNS.filter((k) => visible.includes(k)),
    [visible],
  );
  // Tertile thresholds derived from the *full* population (not filtered),
  // so a band label means the same thing as you change filters.
  const thresholds = useMemo(() => computeThresholds(shoes), [shoes]);

  function toggleSort(k: ColumnKey) {
    const sk = k as unknown as SortKey;
    if (sortKey === sk) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(sk);
      setSortDir(COLUMN_META[k].numeric ? 'desc' : 'asc');
    }
  }

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-6">
      <aside className="space-y-5 text-sm md:sticky md:top-16 md:self-start max-h-[calc(100vh-5rem)] overflow-y-auto pr-1">
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted mb-1">
            Search
          </label>
          <input
            value={f.q}
            onChange={(e) => setF({ ...f, q: e.target.value })}
            placeholder="brand, model, foam…"
            className="w-full bg-panel border border-line rounded px-3 py-2 outline-none focus:border-accent"
          />
        </div>

        <ChipFilter
          label="Brand"
          options={meta.brands}
          selected={f.brands}
          onChange={(v) => setF({ ...f, brands: v })}
        />
        <ChipFilter
          label="Type"
          options={meta.types}
          selected={f.types}
          onChange={(v) => setF({ ...f, types: v })}
          renderLabel={(t) => `${t} · ${TYPE_LABEL[t] ?? ''}`.trim()}
        />
        <ChipFilter
          label="Foam"
          options={meta.foams}
          selected={f.foams}
          onChange={(v) => setF({ ...f, foams: v })}
        />
        <ChipFilter
          label="Category"
          options={meta.categories}
          selected={f.categories}
          onChange={(v) => setF({ ...f, categories: v })}
        />

        <NumField
          label="Max Price (IDR)"
          value={f.priceMax}
          onChange={(v) => setF({ ...f, priceMax: v })}
          placeholder="e.g. 3000000"
        />
        <NumField
          label="Max Weight (g)"
          value={f.weightMax}
          onChange={(v) => setF({ ...f, weightMax: v })}
          placeholder="e.g. 250"
        />
        <NumField
          label="Min Heel ER %"
          value={f.herMin}
          onChange={(v) => setF({ ...f, herMin: v })}
          placeholder="e.g. 65"
        />
        <NumField
          label="Min Fore ER %"
          value={f.ferMin}
          onChange={(v) => setF({ ...f, ferMin: v })}
          placeholder="e.g. 65"
        />
        <div className="grid grid-cols-2 gap-2">
          <NumField
            label="Min Drop"
            value={f.dropMin}
            onChange={(v) => setF({ ...f, dropMin: v })}
          />
          <NumField
            label="Max Drop"
            value={f.dropMax}
            onChange={(v) => setF({ ...f, dropMax: v })}
          />
        </div>

        <button
          onClick={() => setF(EMPTY_FILTERS)}
          className="w-full border border-line rounded px-3 py-2 hover:bg-panel"
        >
          Reset filters
        </button>
      </aside>

      <section>
        <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
          <h1 className="text-lg font-semibold">
            {rows.length}{' '}
            <span className="text-muted font-normal">of {shoes.length} shoes</span>
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted">
              data {meta.generatedAt} · compare {compare.ids.length}/{MAX_COMPARE}
            </p>
            <ColumnPicker visible={visible} onChange={setVisible} />
          </div>
        </div>

        <div className="overflow-x-auto border border-line rounded-lg">
          <table className="w-full text-sm num">
            <thead className="bg-panel text-muted text-xs sticky top-0">
              <tr>
                <th className="p-2 text-left w-10"></th>
                {visibleCols.map((k) => {
                  const meta = COLUMN_META[k];
                  const active = sortKey === (k as unknown as SortKey);
                  const arrow = active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
                  return (
                    <th
                      key={k}
                      className={`p-2 select-none cursor-pointer ${
                        meta.align === 'right'
                          ? 'text-right'
                          : meta.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                      }`}
                      onClick={() => toggleSort(k)}
                    >
                      <HeaderTip
                        label={
                          <span className={active ? 'text-ink' : ''}>
                            {meta.label}
                            {arrow}
                          </span>
                        }
                        code={meta.code}
                        tip={meta.tip}
                        learnMoreHref={`/docs/metrics#${k}`}
                        align={meta.align}
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const checked = compare.ids.includes(s.id);
                const disabled = !checked && compare.ids.length >= MAX_COMPARE;
                return (
                  <tr key={s.id} className="border-t border-line/60 hover:bg-panel/50">
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => compare.toggle(s.id)}
                        aria-label="Add to compare"
                      />
                    </td>
                    {visibleCols.map((k) => {
                      const meta = COLUMN_META[k];
                      const v = getField(s, k);
                      const align =
                        meta.align === 'right'
                          ? 'text-right'
                          : meta.align === 'center'
                            ? 'text-center'
                            : 'text-left';
                      if (k === 'version') {
                        return (
                          <td key={k} className="p-2">
                            <Link
                              href={`/shoe/${s.id}`}
                              className="text-accent hover:underline"
                            >
                              {s.version}
                            </Link>
                          </td>
                        );
                      }
                      if (k === 'brand') {
                        return (
                          <td key={k} className="p-2 text-ink">
                            {s.brand}
                          </td>
                        );
                      }
                      if (k === 'type') {
                        const t = s.type;
                        const full = t ? TYPE_LABEL[t] : undefined;
                        return (
                          <td
                            key={k}
                            className={`p-2 ${align} text-muted`}
                            title={full ? `${t} · ${full}` : t ?? ''}
                          >
                            {t ?? '—'}
                          </td>
                        );
                      }
                      const display = meta.format ? meta.format(v) : String(v ?? '—');
                      const band = getBandLabel(k, v, thresholds);
                      const muted = k === 'foam' || k === 'valueIdx';
                      return (
                        <td
                          key={k}
                          className={`p-2 ${align} ${muted ? 'text-muted' : ''}`}
                        >
                          <span>{display}</span>
                          {band && (
                            <span
                              className="ml-1 align-middle inline-block px-1 py-px text-[9px] uppercase tracking-wider text-muted border border-line rounded"
                              title={`Band: ${band} (tertile of population)`}
                            >
                              {band}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td
                    colSpan={visibleCols.length + 1}
                    className="p-8 text-center text-muted"
                  >
                    No shoes match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ChipFilter({
  label,
  options,
  selected,
  onChange,
  renderLabel,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  renderLabel?: (o: string) => string;
}) {
  if (!options.length) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted mb-1">{label}</div>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              onClick={() =>
                onChange(on ? selected.filter((x) => x !== o) : [...selected, o])
              }
              className={`text-xs px-2 py-1 rounded border transition ${
                on
                  ? 'bg-accent text-bg border-accent'
                  : 'border-line text-muted hover:text-ink'
              }`}
            >
              {renderLabel ? renderLabel(o) : o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-muted mb-1">
        {label}
      </label>
      <input
        type="number"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value === '' ? undefined : Number(e.target.value))
        }
        className="w-full bg-panel border border-line rounded px-2 py-1.5 outline-none focus:border-accent num"
      />
    </div>
  );
}

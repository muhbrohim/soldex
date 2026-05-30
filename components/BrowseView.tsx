'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Shoe, Meta, Filters } from '@/lib/types';
import { EMPTY_FILTERS } from '@/lib/types';
import { applyFilters, sortShoes, type SortKey } from '@/lib/filter';
import { formatIdr, formatGrams, formatNum, formatMm } from '@/lib/format';
import { useCompare, MAX_COMPARE } from '@/store/compare';
import { TYPE_LABEL } from '@/lib/derive';

export function BrowseView({ shoes, meta }: { shoes: Shoe[]; meta: Meta }) {
  const [f, setF] = useState<Filters>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>('avgEr');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const compare = useCompare();

  const filtered = useMemo(() => applyFilters(shoes, f), [shoes, f]);
  const rows = useMemo(() => sortShoes(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(k);
      setSortDir(typeof shoes[0]?.[k] === 'number' ? 'desc' : 'asc');
    }
  }

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-6">
      <aside className="space-y-5 text-sm md:sticky md:top-16 md:self-start max-h-[calc(100vh-5rem)] overflow-y-auto pr-1">
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted mb-1">Search</label>
          <input
            value={f.q}
            onChange={(e) => setF({ ...f, q: e.target.value })}
            placeholder="brand, version, foam…"
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
          label="Sheet"
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
          label="Min HER (%)"
          value={f.herMin}
          onChange={(v) => setF({ ...f, herMin: v })}
          placeholder="e.g. 65"
        />
        <NumField
          label="Min FER (%)"
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
        <div className="flex items-baseline justify-between mb-3">
          <h1 className="text-lg font-semibold">
            {rows.length} <span className="text-muted font-normal">of {shoes.length} shoes</span>
          </h1>
          <p className="text-xs text-muted">
            data {meta.generatedAt} · compare {compare.ids.length}/{MAX_COMPARE}
          </p>
        </div>

        <div className="overflow-x-auto border border-line rounded-lg">
          <table className="w-full text-sm num">
            <thead className="bg-panel text-muted text-xs sticky top-0">
              <tr>
                <th className="p-2 text-left w-10"></th>
                <SortHeader k="brand" current={sortKey} dir={sortDir} onClick={toggleSort}>Brand</SortHeader>
                <SortHeader k="version" current={sortKey} dir={sortDir} onClick={toggleSort}>Version</SortHeader>
                <th className="p-2 text-center">Type</th>
                <SortHeader k="her" current={sortKey} dir={sortDir} onClick={toggleSort} align="right">HER</SortHeader>
                <SortHeader k="fer" current={sortKey} dir={sortDir} onClick={toggleSort} align="right">FER</SortHeader>
                <SortHeader k="avgEr" current={sortKey} dir={sortDir} onClick={toggleSort} align="right">avgER</SortHeader>
                <SortHeader k="hsa" current={sortKey} dir={sortDir} onClick={toggleSort} align="right">HSA</SortHeader>
                <SortHeader k="fsa" current={sortKey} dir={sortDir} onClick={toggleSort} align="right">FSA</SortHeader>
                <SortHeader k="weightG" current={sortKey} dir={sortDir} onClick={toggleSort} align="right">W</SortHeader>
                <SortHeader k="drop" current={sortKey} dir={sortDir} onClick={toggleSort} align="right">Drop</SortHeader>
                <th className="p-2 text-left">Foam</th>
                <SortHeader k="priceIdr" current={sortKey} dir={sortDir} onClick={toggleSort} align="right">Price</SortHeader>
                <SortHeader k="valueIdx" current={sortKey} dir={sortDir} onClick={toggleSort} align="right">val/M</SortHeader>
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
                    <td className="p-2 text-ink">{s.brand}</td>
                    <td className="p-2">
                      <Link href={`/shoe/${s.id}`} className="text-accent hover:underline">
                        {s.version}
                      </Link>
                    </td>
                    <td className="p-2 text-center text-muted">{s.type ?? '—'}</td>
                    <td className="p-2 text-right">{formatNum(s.her)}</td>
                    <td className="p-2 text-right">{formatNum(s.fer)}</td>
                    <td className="p-2 text-right font-medium">{formatNum(s.avgEr)}</td>
                    <td className="p-2 text-right">{s.hsa ?? '—'}</td>
                    <td className="p-2 text-right">{s.fsa ?? '—'}</td>
                    <td className="p-2 text-right">{formatGrams(s.weightG)}</td>
                    <td className="p-2 text-right">{formatMm(s.drop)}</td>
                    <td className="p-2 text-muted">{s.foam ?? '—'}</td>
                    <td className="p-2 text-right">{formatIdr(s.priceIdr)}</td>
                    <td className="p-2 text-right text-muted">{formatNum(s.valueIdx)}</td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr><td colSpan={14} className="p-8 text-center text-muted">No shoes match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SortHeader({
  k, current, dir, onClick, children, align = 'left',
}: {
  k: SortKey; current: SortKey; dir: 'asc' | 'desc';
  onClick: (k: SortKey) => void; children: React.ReactNode; align?: 'left' | 'right';
}) {
  const active = current === k;
  return (
    <th className={`p-2 select-none cursor-pointer ${align === 'right' ? 'text-right' : 'text-left'}`} onClick={() => onClick(k)}>
      <span className={active ? 'text-ink' : ''}>{children}{active ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}</span>
    </th>
  );
}

function ChipFilter({
  label, options, selected, onChange, renderLabel,
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
              onClick={() => onChange(on ? selected.filter((x) => x !== o) : [...selected, o])}
              className={`text-xs px-2 py-1 rounded border transition ${
                on ? 'bg-accent text-bg border-accent' : 'border-line text-muted hover:text-ink'
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
  label, value, onChange, placeholder,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-muted mb-1">{label}</label>
      <input
        type="number"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        className="w-full bg-panel border border-line rounded px-2 py-1.5 outline-none focus:border-accent num"
      />
    </div>
  );
}

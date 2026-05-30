'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ALL_COLUMNS,
  COLUMN_META,
  COLUMN_GROUP_LABEL,
  DEFAULT_VISIBLE,
  type ColumnKey,
  type ColumnGroup,
} from '@/lib/columns';

const LS_KEY = 'soldex.columns';

export function loadVisibleColumns(): ColumnKey[] {
  if (typeof window === 'undefined') return DEFAULT_VISIBLE;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_VISIBLE;
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return DEFAULT_VISIBLE;
    const valid = arr.filter((k): k is ColumnKey =>
      ALL_COLUMNS.includes(k as ColumnKey),
    );
    // always keep always-on cols
    for (const k of ALL_COLUMNS) {
      if (COLUMN_META[k].alwaysOn && !valid.includes(k)) valid.push(k);
    }
    return valid.length ? valid : DEFAULT_VISIBLE;
  } catch {
    return DEFAULT_VISIBLE;
  }
}

export function ColumnPicker({
  visible,
  onChange,
}: {
  visible: ColumnKey[];
  onChange: (next: ColumnKey[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function persist(next: ColumnKey[]) {
    // preserve canonical ALL_COLUMNS order
    const ordered = ALL_COLUMNS.filter((k) => next.includes(k));
    onChange(ordered);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(ordered));
    } catch {
      /* ignore */
    }
  }

  function toggle(k: ColumnKey) {
    if (COLUMN_META[k].alwaysOn) return;
    persist(visible.includes(k) ? visible.filter((x) => x !== k) : [...visible, k]);
  }

  function reset() {
    persist(DEFAULT_VISIBLE);
  }
  function showAll() {
    persist(ALL_COLUMNS);
  }
  function hideAll() {
    persist(ALL_COLUMNS.filter((k) => COLUMN_META[k].alwaysOn));
  }

  // group columns
  const groups: Record<ColumnGroup, ColumnKey[]> = {
    identity: [],
    energy: [],
    feel: [],
    outsole: [],
    geomHeight: [],
    geomWidth: [],
    materials: [],
    value: [],
    fit: [],
  };
  for (const k of ALL_COLUMNS) groups[COLUMN_META[k].group].push(k);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs border border-line rounded px-2 py-1.5 hover:bg-panel"
        aria-expanded={open}
      >
        Columns ({visible.length}) ▾
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-40 w-[20rem] max-h-[28rem] overflow-y-auto rounded border border-line bg-bg shadow-xl p-3 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted uppercase tracking-wider text-[10px]">
              Show columns
            </span>
            <div className="flex gap-2 text-[10px]">
              <button onClick={reset} className="text-accent hover:underline">
                Default
              </button>
              <button onClick={showAll} className="text-muted hover:text-ink">
                All
              </button>
              <button onClick={hideAll} className="text-muted hover:text-ink">
                None
              </button>
            </div>
          </div>

          {(Object.keys(groups) as ColumnGroup[]).map((g) => (
            <div key={g} className="mb-3 last:mb-0">
              <div className="text-[10px] uppercase tracking-wider text-muted mb-1">
                {COLUMN_GROUP_LABEL[g]}
              </div>
              <div className="grid grid-cols-2 gap-y-1">
                {groups[g].map((k) => {
                  const meta = COLUMN_META[k];
                  const on = visible.includes(k);
                  return (
                    <label
                      key={k}
                      className={`flex items-center gap-1.5 cursor-pointer ${
                        meta.alwaysOn ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                      title={meta.tip}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={meta.alwaysOn}
                        onChange={() => toggle(k)}
                        className="accent-accent"
                      />
                      <span className="truncate">{meta.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

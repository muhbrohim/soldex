'use client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Shoe } from '@/lib/types';
import {
  ALL_COLUMNS,
  COLUMN_META,
  COLUMN_GROUP_LABEL,
  type ColumnGroup,
  type ColumnKey,
} from '@/lib/columns';
import { TYPE_LABEL } from '@/lib/derive';
import { shoeSlug } from '@/lib/slug';
import {
  createBrand,
  createFoam,
  saveShoe,
  type SaveShoeInput,
} from '@/lib/mutations';
import { useAuth } from './AuthProvider';
import { useBrands, useFoams, useMeta } from '@/lib/hooks';
import { hasSupabase } from '@/lib/supabase';

// Derived / computed columns — never editable.
const READONLY: ColumnKey[] = [
  'avgEr',
  'avgSa',
  'herMinusFer',
  'valueIdx',
  'dailyFit',
  'maxFit',
  'superFit',
];

const NUMERIC_KEYS = ALL_COLUMNS.filter(
  (k) => COLUMN_META[k].numeric && !READONLY.includes(k),
);

const TEXT_KEYS: ColumnKey[] = []; // 'foam' handled specially below
const NOTE_KEYS: ('minus' | 'conclusion' | 'reBuy')[] = [
  'conclusion',
  'minus',
  'reBuy',
];
const NOTE_LABEL: Record<(typeof NOTE_KEYS)[number], string> = {
  conclusion: "What's good",
  minus: "What's bad",
  reBuy: 'Would buy again',
};

// Group ordering for the form. We render identity inline at the top, then
// everything else grouped by ColumnGroup, with materials/foam injected.
const FORM_GROUPS: ColumnGroup[] = [
  'energy',
  'feel',
  'outsole',
  'geomHeight',
  'geomWidth',
  'materials',
  'value',
];

type FormShoe = Partial<Shoe>;

export function ShoeForm({
  initial,
  mode,
}: {
  initial?: Shoe;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: brands = [], mutate: refetchBrands } = useBrands();
  const { data: foams = [], mutate: refetchFoams } = useFoams();
  const { data: meta } = useMeta();

  const [form, setForm] = useState<FormShoe>(() => ({
    ...initial,
    hasPlate: initial?.hasPlate ?? null,
    hasRocker: initial?.hasRocker ?? null,
  }));
  const [cats, setCats] = useState<string[]>(initial?.categories ?? []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const allCats = useMemo(
    () => Array.from(new Set([...(meta?.categories ?? []), ...cats])).sort(),
    [meta?.categories, cats],
  );

  const id = useMemo(() => {
    if (mode === 'edit') return initial!.id;
    if (!form.brand || !form.version) return '';
    return shoeSlug(form.brand, form.version);
  }, [mode, initial, form.brand, form.version]);

  function patch(p: Partial<FormShoe>) {
    setForm((f) => ({ ...f, ...p }));
  }

  async function onCreateBrand(name: string) {
    const created = await createBrand(name);
    await refetchBrands();
    patch({ brand: created });
  }
  async function onCreateFoam(name: string) {
    const created = await createFoam(name);
    await refetchFoams();
    patch({ foam: created });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!user) {
      setErr('You must be signed in.');
      return;
    }
    if (!form.brand || !form.version) {
      setErr('Brand and Model are required.');
      return;
    }
    if (!id) {
      setErr('Could not derive a slug from brand + model.');
      return;
    }
    setBusy(true);
    try {
      const input: SaveShoeInput = { ...form, id, brand: form.brand, version: form.version };
      await saveShoe(input, cats, { actorId: user.id, isNew: mode === 'create' });
      router.push(`/shoe/${id}`);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-3xl">
      <header className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">
          {mode === 'create' ? 'New shoe' : `Edit · ${initial?.brand} ${initial?.version}`}
        </h1>
        <p className="text-xs text-muted">
          id: <code className="font-mono">{id || '—'}</code>
        </p>
      </header>

      {!hasSupabase && (
        <p className="text-xs text-amber-300 border border-amber-700/60 rounded p-2">
          Supabase not configured — saving will fail. Set
          NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable
          writes.
        </p>
      )}

      <Section title="Identity">
        <Combobox
          label="Brand *"
          value={form.brand ?? ''}
          options={brands}
          onChange={(v) => patch({ brand: v })}
          onCreate={onCreateBrand}
          createLabel="Add brand"
          required
        />
        <Field label="Model *">
          <input
            value={form.version ?? ''}
            onChange={(e) => patch({ version: e.target.value })}
            required
            className="input"
          />
        </Field>
        <Field label="Type">
          <select
            value={form.type ?? ''}
            onChange={(e) => patch({ type: e.target.value || undefined })}
            className="input"
          >
            <option value="">—</option>
            {Object.entries(TYPE_LABEL).map(([k, lbl]) => (
              <option key={k} value={k}>
                {k} · {lbl}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      {FORM_GROUPS.map((g) => {
        const keys = NUMERIC_KEYS.filter((k) => COLUMN_META[k].group === g);
        const hasFoam = g === 'materials';
        if (!keys.length && !hasFoam) return null;
        return (
          <Section key={g} title={COLUMN_GROUP_LABEL[g]}>
            {keys.map((k) => (
              <Field key={k} label={COLUMN_META[k].label}>
                <input
                  type="number"
                  step="any"
                  value={(form as Record<string, unknown>)[k] as number | undefined ?? ''}
                  onChange={(e) =>
                    patch({
                      [k]: e.target.value === '' ? undefined : Number(e.target.value),
                    } as Partial<FormShoe>)
                  }
                  className="input num"
                />
              </Field>
            ))}
            {hasFoam && (
              <Combobox
                label="Midsole foam"
                value={form.foam ?? ''}
                options={foams}
                onChange={(v) => patch({ foam: v || undefined })}
                onCreate={onCreateFoam}
                createLabel="Add foam"
              />
            )}
          </Section>
        );
      })}

      <Section title="Pre-requisites">
        <Tri
          label="Has plate?"
          value={form.hasPlate ?? null}
          onChange={(v) => patch({ hasPlate: v })}
        />
        <Tri
          label="Has rocker?"
          value={form.hasRocker ?? null}
          onChange={(v) => patch({ hasRocker: v })}
        />
      </Section>

      <Section title="Categories" full>
        <div className="flex flex-wrap gap-1">
          {allCats.map((c) => {
            const on = cats.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() =>
                  setCats(on ? cats.filter((x) => x !== c) : [...cats, c])
                }
                className={`text-xs px-2 py-1 rounded border ${
                  on
                    ? 'bg-accent text-bg border-accent'
                    : 'border-line text-muted hover:text-ink'
                }`}
              >
                {c}
              </button>
            );
          })}
          <AddCategory onAdd={(c) => !cats.includes(c) && setCats([...cats, c])} />
        </div>
      </Section>

      <Section title="Owner notes" full>
        {NOTE_KEYS.map((k) => (
          <Field key={k} label={NOTE_LABEL[k]} full>
            <textarea
              value={(form as Record<string, unknown>)[k] as string | undefined ?? ''}
              onChange={(e) => patch({ [k]: e.target.value } as Partial<FormShoe>)}
              rows={2}
              className="input"
            />
          </Field>
        ))}
      </Section>

      {err && (
        <p className="text-xs text-rose-400 border border-rose-900/60 rounded p-2">
          {err}
        </p>
      )}

      <div className="flex gap-2 sticky bottom-2 bg-bg/90 backdrop-blur p-3 border border-line rounded">
        <button
          type="submit"
          disabled={busy || !user}
          className="bg-accent text-bg rounded px-4 py-2 font-medium disabled:opacity-50"
        >
          {busy ? 'Saving…' : mode === 'create' ? 'Create shoe' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border border-line rounded px-4 py-2 hover:bg-panel"
        >
          Cancel
        </button>
        {!user && (
          <span className="text-xs text-muted ml-2 self-center">
            Sign in to save.
          </span>
        )}
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          background: var(--panel, #15161a);
          border: 1px solid var(--line, #2a2b30);
          border-radius: 0.25rem;
          padding: 0.35rem 0.5rem;
          outline: none;
          font-size: 0.875rem;
          color: inherit;
        }
        :global(.input:focus) {
          border-color: var(--accent, #7dd3fc);
        }
      `}</style>
    </form>
  );
}

// ----------------------------- subcomponents ----------------------------

function Section({
  title,
  children,
  full = false,
}: {
  title: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <section>
      <h2 className="text-sm uppercase tracking-wider text-muted mb-2">
        {title}
      </h2>
      <div
        className={
          full ? 'space-y-2' : 'grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-2'
        }
      >
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block text-xs ${full ? '' : ''}`}>
      <span className="block uppercase tracking-wider text-muted mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function Tri({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) {
  const opts: { v: boolean | null; lbl: string }[] = [
    { v: null, lbl: 'Unknown' },
    { v: true, lbl: 'Yes' },
    { v: false, lbl: 'No' },
  ];
  return (
    <Field label={label}>
      <div className="flex gap-1">
        {opts.map((o) => {
          const on = value === o.v;
          return (
            <button
              key={String(o.v)}
              type="button"
              onClick={() => onChange(o.v)}
              className={`text-xs px-2 py-1 rounded border ${
                on
                  ? 'bg-accent text-bg border-accent'
                  : 'border-line text-muted hover:text-ink'
              }`}
            >
              {o.lbl}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

function Combobox({
  label,
  value,
  options,
  onChange,
  onCreate,
  createLabel,
  required,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  onCreate?: (name: string) => Promise<void>;
  createLabel?: string;
  required?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function confirm() {
    if (!onCreate || !draft.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await onCreate(draft.trim());
      setAdding(false);
      setDraft('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Field label={label}>
      <div className="flex gap-1">
        <select
          value={options.includes(value) ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="input flex-1"
        >
          <option value="">—</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {onCreate && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-xs px-2 border border-line rounded text-muted hover:text-ink"
            title={createLabel}
          >
            +
          </button>
        )}
      </div>
      {adding && (
        <div className="mt-1 flex gap-1">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={createLabel}
            autoFocus
            className="input flex-1"
          />
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="text-xs px-2 bg-accent text-bg rounded disabled:opacity-50"
          >
            {busy ? '…' : 'Add'}
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setDraft('');
              setErr(null);
            }}
            className="text-xs px-2 border border-line rounded text-muted"
          >
            ✕
          </button>
        </div>
      )}
      {err && <p className="text-[10px] text-rose-400 mt-1">{err}</p>}
    </Field>
  );
}

function AddCategory({ onAdd }: { onAdd: (c: string) => void }) {
  const [v, setV] = useState('');
  return (
    <span className="inline-flex items-center gap-1">
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="+ category"
        className="text-xs px-2 py-1 border border-line rounded bg-panel w-28"
      />
      <button
        type="button"
        onClick={() => {
          if (v.trim()) {
            onAdd(v.trim().toUpperCase());
            setV('');
          }
        }}
        className="text-xs px-2 py-1 border border-line rounded text-muted hover:text-ink"
      >
        Add
      </button>
    </span>
  );
}

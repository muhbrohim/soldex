// SWR-based data hooks. Single switchboard between two backends:
//
//   - When NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY are set, fetch from Supabase
//     (the shoes_full view returns categories as an aggregated array).
//   - Otherwise fall back to the bundled JSON in /public/data/. This keeps
//     the site functional pre-migration and avoids needing env vars at
//     build time.
//
// All hooks return the same shape: { data, error, isLoading, mutate }.
'use client';
import useSWR from 'swr';
import shoesJson from '@/public/data/shoes.json';
import metaJson from '@/public/data/meta.json';
import { supabase, hasSupabase } from './supabase';
import { withFits } from './preferences';
import type { Shoe, Meta } from './types';

// snake_case row from supabase -> Shoe (camelCase).
function rowToShoe(r: Record<string, unknown>): Shoe {
  const n = (k: string) =>
    r[k] == null ? undefined : (r[k] as number);
  const s = (k: string) =>
    r[k] == null ? undefined : (r[k] as string);
  return {
    id: r.id as string,
    brand: r.brand as string,
    version: r.version as string,
    type: s('type'),
    her: n('her'),
    fer: n('fer'),
    hsa: n('hsa'),
    fsa: n('fsa'),
    weightG: n('weight_g'),
    priceIdr: n('price_idr'),
    heel: n('heel'),
    fore: n('fore'),
    drop: n('drop'),
    width: n('width'),
    toe: n('toe'),
    mFore: n('m_fore'),
    oThick: n('o_thick'),
    drem: n('drem'),
    oDurPct: n('o_dur_pct'),
    oStay: n('o_stay'),
    trac: n('trac'),
    mSoft: n('m_soft'),
    flexStiff: n('flex_stiff'),
    torsRigid: n('tors_rigid'),
    upFoam: n('up_foam'),
    myApprox: n('my_approx'),
    minus: s('minus'),
    conclusion: s('conclusion'),
    reBuy: s('re_buy'),
    foam: s('foam'),
    hasPlate: r.has_plate == null ? null : (r.has_plate as boolean),
    hasRocker: r.has_rocker == null ? null : (r.has_rocker as boolean),
    categories: Array.isArray(r.categories) ? (r.categories as string[]) : [],
  };
}

// ---------------------- Bundled-JSON fallback ----------------------------
const FALLBACK_SHOES: Shoe[] = withFits(shoesJson as Shoe[]);
const FALLBACK_META: Meta = metaJson as unknown as Meta;

// --------------------------- Fetchers ------------------------------------
async function fetchShoes(includeDeleted = false): Promise<Shoe[]> {
  if (!hasSupabase || !supabase) return FALLBACK_SHOES;
  const q = supabase.from('shoes_full').select('*');
  const { data, error } = includeDeleted
    ? await q
    : await q.is('deleted_at', null);
  if (error) throw error;
  const rows = (data ?? []).map(rowToShoe);
  return withFits(rows);
}

async function fetchMeta(): Promise<Meta> {
  if (!hasSupabase || !supabase) return FALLBACK_META;
  // Cheap aggregation: pull brand/foam/type/category lists from existing rows.
  const { data, error } = await supabase
    .from('shoes_full')
    .select('brand, foam, type, categories')
    .is('deleted_at', null);
  if (error) throw error;
  const brands = new Set<string>();
  const foams = new Set<string>();
  const types = new Set<string>();
  const categories = new Set<string>();
  let count = 0;
  for (const r of data ?? []) {
    count += 1;
    if (r.brand) brands.add(r.brand as string);
    if (r.foam) foams.add(r.foam as string);
    if (r.type) types.add(r.type as string);
    for (const c of (r.categories as string[]) ?? []) categories.add(c);
  }
  return {
    generatedAt: new Date().toISOString().slice(0, 10),
    shoeCount: count,
    brands: [...brands].sort(),
    foams: [...foams].sort(),
    types: [...types].sort(),
    categories: [...categories].sort(),
    ranges: {},
  };
}

// ----------------------------- Hooks -------------------------------------
export function useShoes(opts: { includeDeleted?: boolean } = {}) {
  const key = ['shoes', opts.includeDeleted ?? false] as const;
  return useSWR(key, () => fetchShoes(opts.includeDeleted), {
    fallbackData: opts.includeDeleted ? undefined : FALLBACK_SHOES,
    revalidateOnFocus: false,
  });
}

export function useShoe(id: string | undefined) {
  return useSWR(
    id ? ['shoe', id] : null,
    async () => {
      const all = await fetchShoes();
      return all.find((s) => s.id === id);
    },
    { revalidateOnFocus: false },
  );
}

export function useMeta() {
  return useSWR('meta', fetchMeta, {
    fallbackData: FALLBACK_META,
    revalidateOnFocus: false,
  });
}

export function useBrands() {
  return useSWR(
    'brands',
    async () => {
      if (!hasSupabase || !supabase) return FALLBACK_META.brands;
      const { data, error } = await supabase
        .from('brands')
        .select('name')
        .order('name');
      if (error) throw error;
      return (data ?? []).map((r) => r.name as string);
    },
    { revalidateOnFocus: false, fallbackData: FALLBACK_META.brands },
  );
}

export function useFoams() {
  return useSWR(
    'foams',
    async () => {
      if (!hasSupabase || !supabase) return FALLBACK_META.foams;
      const { data, error } = await supabase
        .from('foams')
        .select('name')
        .order('name');
      if (error) throw error;
      return (data ?? []).map((r) => r.name as string);
    },
    { revalidateOnFocus: false, fallbackData: FALLBACK_META.foams },
  );
}

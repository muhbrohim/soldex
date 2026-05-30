/**
 * One-time importer: load public/data/shoes.json (plus brands/foams/types
 * from meta.json) into Supabase.
 *
 * Idempotent: uses upsert on the slug-as-primary-key for shoes, and
 * name-as-unique for brands/foams. Safe to re-run after editing rows.
 *
 * Usage:
 *   1. cp .env.local.example .env.local  (or set env directly)
 *   2. Fill SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *      (service role bypasses RLS; treat the file as secret)
 *   3. npx tsx scripts/migrate_to_supabase.ts
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    'Missing env. Need SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.',
  );
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

interface ShoeJson {
  id: string;
  brand: string;
  version: string;
  type?: string;
  her?: number;
  fer?: number;
  hsa?: number;
  fsa?: number;
  weightG?: number;
  priceIdr?: number;
  heel?: number;
  fore?: number;
  drop?: number;
  width?: number;
  toe?: number;
  mFore?: number;
  oThick?: number;
  drem?: number;
  oDurPct?: number;
  oStay?: number;
  trac?: number;
  mSoft?: number;
  flexStiff?: number;
  torsRigid?: number;
  upFoam?: number;
  myApprox?: number;
  minus?: string;
  conclusion?: string;
  reBuy?: string;
  foam?: string;
  categories?: string[];
}

interface MetaJson {
  brands: string[];
  foams: string[];
}

function readJson<T>(rel: string): T {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), rel), 'utf8'),
  ) as T;
}

// camelCase -> snake_case mapping for shoes table columns.
function toRow(s: ShoeJson) {
  return {
    id: s.id,
    brand: s.brand,
    version: s.version,
    type: s.type ?? null,
    her: s.her ?? null,
    fer: s.fer ?? null,
    hsa: s.hsa ?? null,
    fsa: s.fsa ?? null,
    weight_g: s.weightG ?? null,
    price_idr: s.priceIdr ?? null,
    heel: s.heel ?? null,
    fore: s.fore ?? null,
    drop: s.drop ?? null,
    width: s.width ?? null,
    toe: s.toe ?? null,
    m_fore: s.mFore ?? null,
    o_thick: s.oThick ?? null,
    drem: s.drem ?? null,
    o_dur_pct: s.oDurPct ?? null,
    o_stay: s.oStay ?? null,
    trac: s.trac ?? null,
    m_soft: s.mSoft ?? null,
    flex_stiff: s.flexStiff ?? null,
    tors_rigid: s.torsRigid ?? null,
    up_foam: s.upFoam ?? null,
    my_approx: s.myApprox ?? null,
    minus: s.minus ?? null,
    conclusion: s.conclusion ?? null,
    re_buy: s.reBuy ?? null,
    foam: s.foam ?? null,
    has_plate: null as boolean | null,
    has_rocker: null as boolean | null,
  };
}

async function main() {
  const shoes = readJson<ShoeJson[]>('public/data/shoes.json');
  const meta = readJson<MetaJson>('public/data/meta.json');

  console.log(
    `Loaded ${shoes.length} shoes, ${meta.brands.length} brands, ${meta.foams.length} foams from public/data/.`,
  );

  // 1. Brands (must come before shoes — shoes.brand FKs to brands.name)
  {
    const rows = meta.brands.map((name) => ({ name }));
    const { error } = await sb.from('brands').upsert(rows, { onConflict: 'name' });
    if (error) throw error;
    console.log(`✓ brands: upserted ${rows.length}`);
  }

  // 2. Foams
  {
    const rows = meta.foams.map((name) => ({ name }));
    const { error } = await sb.from('foams').upsert(rows, { onConflict: 'name' });
    if (error) throw error;
    console.log(`✓ foams: upserted ${rows.length}`);
  }

  // 3. Shoes (chunked to keep payloads under PostgREST limits)
  const rows = shoes.map(toRow);
  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error } = await sb.from('shoes').upsert(slice, { onConflict: 'id' });
    if (error) throw error;
    console.log(`✓ shoes: upserted ${i + slice.length} / ${rows.length}`);
  }

  // 4. Categories — clear & re-insert per shoe to mirror the JSON exactly.
  let total = 0;
  for (const s of shoes) {
    const cats = s.categories ?? [];
    const { error: delErr } = await sb
      .from('shoe_categories')
      .delete()
      .eq('shoe_id', s.id);
    if (delErr) throw delErr;
    if (!cats.length) continue;
    const { error } = await sb
      .from('shoe_categories')
      .insert(cats.map((category) => ({ shoe_id: s.id, category })));
    if (error) throw error;
    total += cats.length;
  }
  console.log(`✓ shoe_categories: synced ${total} mappings across ${shoes.length} shoes`);

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

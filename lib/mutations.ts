// Write-side helpers for shoes / brands / foams. All require an authed
// session (RLS enforces this). Components should disable their save UI
// when useAuth().user is null.
import { supabase, hasSupabase } from './supabase';
import type { Shoe } from './types';

export interface SaveShoeInput extends Partial<Shoe> {
  id: string;
  brand: string;
  version: string;
  hasPlate?: boolean | null;
  hasRocker?: boolean | null;
}

function toRow(s: SaveShoeInput) {
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
    minus: s.minus || null,
    conclusion: s.conclusion || null,
    re_buy: s.reBuy || null,
    foam: s.foam || null,
    has_plate: s.hasPlate ?? null,
    has_rocker: s.hasRocker ?? null,
  };
}

function need() {
  if (!hasSupabase || !supabase) {
    throw new Error('Supabase not configured (missing NEXT_PUBLIC_SUPABASE_URL).');
  }
  return supabase;
}

export async function saveShoe(
  input: SaveShoeInput,
  categories: string[],
  opts: { actorId?: string | null; isNew?: boolean } = {},
) {
  const sb = need();
  const row = toRow(input);

  // Stamp created_by on insert / updated_by on update
  const stamped = opts.isNew
    ? { ...row, created_by: opts.actorId ?? null, updated_by: opts.actorId ?? null }
    : { ...row, updated_by: opts.actorId ?? null };

  const { error } = await sb.from('shoes').upsert(stamped, { onConflict: 'id' });
  if (error) throw error;

  // Re-sync categories (delete then insert; cheap for small lists).
  const { error: delErr } = await sb
    .from('shoe_categories')
    .delete()
    .eq('shoe_id', input.id);
  if (delErr) throw delErr;
  if (categories.length) {
    const { error: insErr } = await sb
      .from('shoe_categories')
      .insert(categories.map((category) => ({ shoe_id: input.id, category })));
    if (insErr) throw insErr;
  }
}

export async function softDeleteShoe(id: string, actorId?: string | null) {
  const sb = need();
  const { error } = await sb
    .from('shoes')
    .update({ deleted_at: new Date().toISOString(), updated_by: actorId ?? null })
    .eq('id', id);
  if (error) throw error;
}

export async function restoreShoe(id: string, actorId?: string | null) {
  const sb = need();
  const { error } = await sb
    .from('shoes')
    .update({ deleted_at: null, updated_by: actorId ?? null })
    .eq('id', id);
  if (error) throw error;
}

export async function createBrand(name: string): Promise<string> {
  const sb = need();
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Brand name is required.');
  const { error } = await sb.from('brands').insert({ name: trimmed });
  if (error && !error.message.includes('duplicate')) throw error;
  return trimmed;
}

export async function createFoam(name: string): Promise<string> {
  const sb = need();
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Foam name is required.');
  const { error } = await sb.from('foams').insert({ name: trimmed });
  if (error && !error.message.includes('duplicate')) throw error;
  return trimmed;
}

export interface RevisionRow {
  id: number;
  shoe_id: string;
  op: 'insert' | 'update' | 'delete' | 'restore';
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  changed: string[] | null;
  actor: string | null;
  at: string;
}

export async function fetchRevisions(shoeId: string): Promise<RevisionRow[]> {
  const sb = need();
  const { data, error } = await sb
    .from('shoe_revisions')
    .select('*')
    .eq('shoe_id', shoeId)
    .order('at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as RevisionRow[];
}

// Tertile-based descriptive bands ("Low / Mid / High" style labels).
//
// We compute tertile cutpoints from the live population for each numeric
// column that has bands defined. Bands are purely *descriptive* (Soft /
// Balanced / Firm, Narrow / Med / Wide, etc.) and intentionally never
// imply a value judgement.
import type { Shoe } from './types';
import type { ColumnKey } from './columns';

export type BandTier = 'low' | 'mid' | 'high';

// Ordinal label sets: [lowLabel, midLabel, highLabel].
// Tone-neutral where possible; some metrics have a natural "good/bad" axis
// (durability, traction, value) — we keep those domain-friendly.
export const BAND_LABELS: Partial<Record<ColumnKey, [string, string, string]>> = {
  // Energy & shock
  her:   ['Low', 'Mid', 'High'],
  fer:   ['Low', 'Mid', 'High'],
  avgEr: ['Low', 'Mid', 'High'],
  hsa:   ['Low', 'Mid', 'High'],
  fsa:   ['Low', 'Mid', 'High'],
  avgSa: ['Low', 'Mid', 'High'],

  // Feel
  mSoft:     ['Firm', 'Balanced', 'Soft'],
  flexStiff: ['Flexible', 'Moderate', 'Stiff'],
  torsRigid: ['Flexible', 'Moderate', 'Rigid'],

  // Outsole
  oDurPct: ['Bad', 'Decent', 'Good'],
  oStay:   ['Bad', 'Decent', 'Good'],
  trac:    ['Bad', 'Decent', 'Good'],

  // Geometry — heights
  weightG: ['Light', 'Medium', 'Heavy'],
  heel:    ['Low', 'Med', 'High'],
  fore:    ['Low', 'Med', 'High'],
  drop:    ['Low', 'Med', 'High'],
  drem:    ['Low', 'Med', 'High'],
  oThick:  ['Thin', 'Medium', 'Thick'],

  // Geometry — widths
  mFore:  ['Narrow', 'Med', 'Wide'],
  width:  ['Narrow', 'Med', 'Wide'],
  toe:    ['Narrow', 'Med', 'Wide'],
  upFoam: ['Tucked', 'Neutral', 'Flared'],

  // Value
  priceIdr: ['Cheap', 'Mid', 'Expensive'],
  valueIdx: ['Bad', 'Decent', 'Good'],

  // Owner-supplied
  myApprox: ['Light', 'Medium', 'Heavy'],
};

export type Thresholds = Partial<Record<ColumnKey, [number, number]>>; // [t1, t2]

/** Compute tertile cutpoints (33rd, 66th percentile) per band-eligible column. */
export function computeThresholds(shoes: Shoe[]): Thresholds {
  const out: Thresholds = {};
  for (const key of Object.keys(BAND_LABELS) as ColumnKey[]) {
    const vals: number[] = [];
    for (const s of shoes) {
      const v = (s as unknown as Record<string, unknown>)[key];
      if (typeof v === 'number' && !Number.isNaN(v)) vals.push(v);
    }
    if (vals.length < 6) continue; // not enough data
    vals.sort((a, b) => a - b);
    const q = (p: number) => {
      const idx = (vals.length - 1) * p;
      const lo = Math.floor(idx);
      const hi = Math.ceil(idx);
      if (lo === hi) return vals[lo];
      return vals[lo] + (vals[hi] - vals[lo]) * (idx - lo);
    };
    out[key] = [q(1 / 3), q(2 / 3)];
  }
  return out;
}

/** Map a value to its band tier given precomputed thresholds. */
export function getBandTier(
  key: ColumnKey,
  value: unknown,
  thresholds: Thresholds,
): BandTier | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  const t = thresholds[key];
  if (!t) return null;
  if (value <= t[0]) return 'low';
  if (value <= t[1]) return 'mid';
  return 'high';
}

/** Get the human-readable band label for a value. */
export function getBandLabel(
  key: ColumnKey,
  value: unknown,
  thresholds: Thresholds,
): string | null {
  const tier = getBandTier(key, value, thresholds);
  if (!tier) return null;
  const labels = BAND_LABELS[key];
  if (!labels) return null;
  return labels[tier === 'low' ? 0 : tier === 'mid' ? 1 : 2];
}

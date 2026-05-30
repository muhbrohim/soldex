// Owner's personal preference profiles. Encoded directly from the criteria
// matrix shared on 2026-05-30. This is NOT a recommendation engine — it is a
// transparent score of how each shoe aligns with the owner's stated taste
// for three usage profiles: DAILY, MAX, SUPER.
//
// Two criteria from the original matrix are NOT scored here because they are
// not measured in the dataset:
//   - rocker (geometry) — not in the source spreadsheet
//   - plate presence — not a recorded boolean
// They are documented in /docs/preferences as caveats.

import type { Shoe } from './types';

export type ProfileKey = 'daily' | 'max' | 'super';

export const PROFILE_LABEL: Record<ProfileKey, string> = {
  daily: 'Daily',
  max: 'Max',
  super: 'Super',
};

// Direction: +1 = higher is better for this profile; -1 = lower is better.
// `weight` is the relative importance of each criterion within a profile.
type CriterionDir = 1 | -1;

interface Criterion {
  field: keyof Shoe; // numeric field on Shoe
  label: string; // short label for the breakdown UI
  // Direction per profile.
  daily: CriterionDir;
  max: CriterionDir;
  super: CriterionDir;
  weight?: number; // optional weight; default 1
}

export const CRITERIA: Criterion[] = [
  // Performance — higher is better for all three.
  { field: 'her', label: 'Heel ER %', daily: 1, max: 1, super: 1 },
  { field: 'fer', label: 'Fore ER %', daily: 1, max: 1, super: 1 },
  { field: 'hsa', label: 'Heel SA', daily: 1, max: 1, super: 1 },
  { field: 'fsa', label: 'Fore SA', daily: 1, max: 1, super: 1 },

  // Structure — daily wants flexible (low torsRigid + low flexStiff);
  // max + super want rigid (high).
  { field: 'torsRigid', label: 'Twist rigidity', daily: -1, max: 1, super: 1 },
  { field: 'flexStiff', label: 'Bend stiffness', daily: -1, max: 1, super: 1 },

  // Durability — higher is better for all three.
  { field: 'oDurPct', label: 'Outsole dur %', daily: 1, max: 1, super: 1 },
  { field: 'oStay', label: 'Outsole bond', daily: 1, max: 1, super: 1 },

  // Weight — daily + super want light; max accepts heavy.
  { field: 'weightG', label: 'Weight', daily: -1, max: 1, super: -1 },

  // Stability via forefoot flare (upFoam = mFore − width).
  // Daily prefers smaller flare, max + super prefer larger.
  { field: 'upFoam', label: 'Forefoot flare', daily: -1, max: 1, super: 1 },

  // Midsole softness — daily + max want firm (low mSoft), super wants soft.
  { field: 'mSoft', label: 'Midsole softness', daily: -1, max: -1, super: 1 },

  // Price — all profiles prefer cheaper.
  { field: 'priceIdr', label: 'Price', daily: -1, max: -1, super: -1 },

  // Traction — higher is better for all three.
  { field: 'trac', label: 'Traction', daily: 1, max: 1, super: 1 },
];

// Cached population stats per field.
type Stats = { mean: number; std: number };
let STATS: Record<string, Stats> | null = null;

function computeStats(shoes: Shoe[]): Record<string, Stats> {
  const out: Record<string, Stats> = {};
  for (const c of CRITERIA) {
    const vals = shoes
      .map((s) => s[c.field] as unknown)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    if (!vals.length) {
      out[c.field as string] = { mean: 0, std: 1 };
      continue;
    }
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance =
      vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
    out[c.field as string] = { mean, std: Math.sqrt(variance) || 1 };
  }
  return out;
}

export function primeStats(shoes: Shoe[]): void {
  STATS = computeStats(shoes);
}

/**
 * Per-criterion aligned score in [0, 1]: z-score clipped to ±2, oriented by
 * profile direction so that 1 = aligned with preference, 0 = strongly against.
 */
function criterionScore(
  value: number | undefined,
  field: string,
  dir: CriterionDir,
  stats: Record<string, Stats>,
): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const s = stats[field];
  if (!s) return null;
  const z = (value - s.mean) / s.std;
  const aligned = z * dir; // higher = more aligned
  const clipped = Math.max(-2, Math.min(2, aligned));
  return (clipped + 2) / 4; // map [-2, 2] -> [0, 1]
}

export interface ProfileBreakdown {
  field: string;
  label: string;
  direction: 'higher' | 'lower';
  value: number | null;
  score: number | null; // 0–1 aligned, null if missing
}

export interface ProfileFit {
  profile: ProfileKey;
  score: number | null; // 0–100, null if no criteria available
  coverage: number; // 0–1: fraction of criteria with data
  breakdown: ProfileBreakdown[];
}

export function computeFit(
  shoe: Shoe,
  profile: ProfileKey,
  shoes?: Shoe[],
): ProfileFit {
  if (!STATS && shoes) primeStats(shoes);
  const stats = STATS ?? { _: { mean: 0, std: 1 } };

  const breakdown: ProfileBreakdown[] = [];
  let sum = 0;
  let n = 0;
  for (const c of CRITERIA) {
    const dir = c[profile];
    const v = shoe[c.field] as unknown;
    const value = typeof v === 'number' ? v : null;
    const score = criterionScore(value ?? undefined, c.field as string, dir, stats);
    breakdown.push({
      field: c.field as string,
      label: c.label,
      direction: dir === 1 ? 'higher' : 'lower',
      value,
      score,
    });
    if (score != null) {
      const w = c.weight ?? 1;
      sum += score * w;
      n += w;
    }
  }
  const score = n > 0 ? +(100 * (sum / n)).toFixed(0) : null;
  const coverage = +(breakdown.filter((b) => b.score != null).length / CRITERIA.length).toFixed(2);
  return { profile, score, coverage, breakdown };
}

/** Compute all three fits at once. */
export function computeAllFits(
  shoe: Shoe,
  shoes?: Shoe[],
): Record<ProfileKey, ProfileFit> {
  return {
    daily: computeFit(shoe, 'daily', shoes),
    max: computeFit(shoe, 'max', shoes),
    super: computeFit(shoe, 'super', shoes),
  };
}

/** Augment a shoe with `dailyFit`, `maxFit`, `superFit` numeric fields. */
export function withFits(shoes: Shoe[]): Shoe[] {
  primeStats(shoes);
  return shoes.map((s) => {
    const f = computeAllFits(s);
    return {
      ...s,
      dailyFit: f.daily.score ?? undefined,
      maxFit: f.max.score ?? undefined,
      superFit: f.super.score ?? undefined,
    } as Shoe;
  });
}

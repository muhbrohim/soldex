// Owner's personal preference profiles. Encoded directly from the criteria
// matrix shared on 2026-05-30. This is NOT a recommendation engine — it is a
// transparent score of how each shoe aligns with the owner's stated taste
// for three usage profiles: DAILY, MAX, SUPER.
//
// has_plate and has_rocker are tri-state booleans (true / false / unknown).
// Unknown values are skipped (reducing coverage %) rather than penalized.

import type { Shoe } from './types';

export type ProfileKey = 'daily' | 'max' | 'super';

export const PROFILE_LABEL: Record<ProfileKey, string> = {
  daily: 'Daily',
  max: 'Max',
  super: 'Super',
};

// Numeric criterion: +1 = higher is better, -1 = lower is better.
// Boolean criterion: true = prefer true, false = prefer false, null = neutral.
type NumDir = 1 | -1;
type BoolPref = boolean | null;

interface NumericCriterion {
  kind: 'num';
  field: keyof Shoe;
  label: string;
  daily: NumDir;
  max: NumDir;
  super: NumDir;
  weight?: number;
}

interface BoolCriterion {
  kind: 'bool';
  field: 'hasPlate' | 'hasRocker';
  label: string;
  daily: BoolPref;
  max: BoolPref;
  super: BoolPref;
  weight?: number;
}

type Criterion = NumericCriterion | BoolCriterion;

export const CRITERIA: Criterion[] = [
  // Performance — higher is better for all three.
  { kind: 'num', field: 'her', label: 'Heel ER %', daily: 1, max: 1, super: 1 },
  { kind: 'num', field: 'fer', label: 'Fore ER %', daily: 1, max: 1, super: 1 },
  { kind: 'num', field: 'hsa', label: 'Heel SA', daily: 1, max: 1, super: 1 },
  { kind: 'num', field: 'fsa', label: 'Fore SA', daily: 1, max: 1, super: 1 },

  // Structure — daily wants flexible (low torsRigid + low flexStiff);
  // max + super want rigid (high).
  { kind: 'num', field: 'torsRigid', label: 'Twist rigidity', daily: -1, max: 1, super: 1 },
  { kind: 'num', field: 'flexStiff', label: 'Bend stiffness', daily: -1, max: 1, super: 1 },

  // Durability — higher is better for all three.
  { kind: 'num', field: 'oDurPct', label: 'Outsole dur %', daily: 1, max: 1, super: 1 },
  { kind: 'num', field: 'oStay', label: 'Outsole bond', daily: 1, max: 1, super: 1 },

  // Weight — daily + super want light; max accepts heavy.
  { kind: 'num', field: 'weightG', label: 'Weight', daily: -1, max: 1, super: -1 },

  // Stability via forefoot flare (upFoam = mFore − width).
  // Daily prefers smaller flare, max + super prefer larger.
  { kind: 'num', field: 'upFoam', label: 'Forefoot flare', daily: -1, max: 1, super: 1 },

  // Midsole softness — daily + max want firm (low mSoft), super wants soft.
  { kind: 'num', field: 'mSoft', label: 'Midsole softness', daily: -1, max: -1, super: 1 },

  // Price — all profiles prefer cheaper.
  { kind: 'num', field: 'priceIdr', label: 'Price', daily: -1, max: -1, super: -1 },

  // Traction — higher is better for all three.
  { kind: 'num', field: 'trac', label: 'Traction', daily: 1, max: 1, super: 1 },

  // Pre-requisite booleans. Super wants both plate and rocker; daily/max
  // are neutral. Unknown values are skipped, not penalized.
  { kind: 'bool', field: 'hasPlate', label: 'Has plate', daily: null, max: null, super: true },
  { kind: 'bool', field: 'hasRocker', label: 'Has rocker', daily: null, max: null, super: true },
];

// Cached population stats per numeric field.
type Stats = { mean: number; std: number };
let STATS: Record<string, Stats> | null = null;

function computeStats(shoes: Shoe[]): Record<string, Stats> {
  const out: Record<string, Stats> = {};
  for (const c of CRITERIA) {
    if (c.kind !== 'num') continue;
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
function numericScore(
  value: number | undefined,
  field: string,
  dir: NumDir,
  stats: Record<string, Stats>,
): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const s = stats[field];
  if (!s) return null;
  const z = (value - s.mean) / s.std;
  const aligned = z * dir;
  const clipped = Math.max(-2, Math.min(2, aligned));
  return (clipped + 2) / 4;
}

export interface ProfileBreakdown {
  field: string;
  label: string;
  direction: 'higher' | 'lower' | 'prefer-true' | 'prefer-false';
  value: number | boolean | null;
  score: number | null;
}

export interface ProfileFit {
  profile: ProfileKey;
  score: number | null;
  coverage: number;
  breakdown: ProfileBreakdown[];
}

export function computeFit(
  shoe: Shoe,
  profile: ProfileKey,
  shoes?: Shoe[],
): ProfileFit {
  if (!STATS && shoes) primeStats(shoes);
  const stats = STATS ?? {};

  const breakdown: ProfileBreakdown[] = [];
  let sum = 0;
  let n = 0;
  let active = 0;
  for (const c of CRITERIA) {
    if (c.kind === 'num') {
      const dir = c[profile];
      const v = shoe[c.field] as unknown;
      const value = typeof v === 'number' ? v : null;
      const score = numericScore(value ?? undefined, c.field as string, dir, stats);
      breakdown.push({
        field: c.field as string,
        label: c.label,
        direction: dir === 1 ? 'higher' : 'lower',
        value,
        score,
      });
      active += 1;
      if (score != null) {
        const w = c.weight ?? 1;
        sum += score * w;
        n += w;
      }
    } else {
      const pref = c[profile];
      if (pref == null) continue; // neutral for this profile; not counted
      active += 1;
      const v = shoe[c.field];
      const value = typeof v === 'boolean' ? v : null;
      const score = value == null ? null : value === pref ? 1 : 0;
      breakdown.push({
        field: c.field,
        label: c.label,
        direction: pref ? 'prefer-true' : 'prefer-false',
        value,
        score,
      });
      if (score != null) {
        const w = c.weight ?? 1;
        sum += score * w;
        n += w;
      }
    }
  }
  const score = n > 0 ? +(100 * (sum / n)).toFixed(0) : null;
  const coverage =
    active > 0
      ? +(breakdown.filter((b) => b.score != null).length / active).toFixed(2)
      : 0;
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

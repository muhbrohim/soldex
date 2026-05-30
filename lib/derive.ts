import type { Shoe } from './types';

const KEYS: (keyof Shoe)[] = ['her', 'fer', 'weightG', 'drop', 'heel'];

export function similar(target: Shoe, all: Shoe[], n = 5): Shoe[] {
  const candidates = all.filter((s) => s.id !== target.id);
  // compute per-key mean/std for normalization
  const stats: Record<string, { mean: number; std: number }> = {};
  for (const k of KEYS) {
    const vals = all.map((s) => s[k] as number | undefined).filter((v): v is number => v != null);
    const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const variance =
      vals.reduce((a, b) => a + (b - mean) ** 2, 0) / (vals.length || 1);
    stats[k] = { mean, std: Math.sqrt(variance) || 1 };
  }
  return candidates
    .map((s) => {
      let d = 0;
      let used = 0;
      for (const k of KEYS) {
        const a = target[k] as number | undefined;
        const b = s[k] as number | undefined;
        if (a == null || b == null) continue;
        const za = (a - stats[k].mean) / stats[k].std;
        const zb = (b - stats[k].mean) / stats[k].std;
        d += (za - zb) ** 2;
        used += 1;
      }
      return { s, d: used ? Math.sqrt(d / used) : Infinity };
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map((x) => x.s);
}

export const TYPE_LABEL: Record<string, string> = {
  R: 'Race',
  D: 'Daily',
  DC: 'Daily-Cushion',
  C: 'Cushion',
  S: 'Speed',
  M: 'Maximalist',
};

import type { Shoe, Filters } from './types';

export function applyFilters(shoes: Shoe[], f: Filters): Shoe[] {
  const q = f.q.trim().toLowerCase();
  return shoes.filter((s) => {
    if (q) {
      const hay = `${s.brand} ${s.version} ${s.foam ?? ''} ${s.type ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.brands.length && !f.brands.includes(s.brand)) return false;
    if (f.types.length && (!s.type || !f.types.includes(s.type))) return false;
    if (f.foams.length && (!s.foam || !f.foams.includes(s.foam))) return false;
    if (
      f.categories.length &&
      !(s.categories ?? []).some((c) => f.categories.includes(c))
    )
      return false;
    if (f.priceMin != null && (s.priceIdr ?? -Infinity) < f.priceMin) return false;
    if (f.priceMax != null && (s.priceIdr ?? Infinity) > f.priceMax) return false;
    if (f.weightMax != null && (s.weightG ?? Infinity) > f.weightMax) return false;
    if (f.herMin != null && (s.her ?? -Infinity) < f.herMin) return false;
    if (f.ferMin != null && (s.fer ?? -Infinity) < f.ferMin) return false;
    if (f.dropMin != null && (s.drop ?? -Infinity) < f.dropMin) return false;
    if (f.dropMax != null && (s.drop ?? Infinity) > f.dropMax) return false;
    return true;
  });
}

// Any Shoe field (string or number) can be a sort key.
export type SortKey = keyof Shoe;

export function sortShoes(rows: Shoe[], key: SortKey, dir: 'asc' | 'desc'): Shoe[] {
  const m = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[key] as unknown;
    const bv = b[key] as unknown;
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * m;
    return String(av).localeCompare(String(bv)) * m;
  });
}

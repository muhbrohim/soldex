const idr = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

export function formatIdr(n?: number | null): string {
  if (n == null) return '—';
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `Rp ${v.toFixed(v < 10 ? 1 : 0)} jt`;
  }
  return `Rp ${idr.format(n)}`;
}

export function formatGrams(n?: number | null): string {
  return n == null ? '—' : `${n} g`;
}

export function formatPct(n?: number | null, digits = 1): string {
  return n == null ? '—' : `${n.toFixed(digits)}%`;
}

export function formatNum(n?: number | null, digits = 1): string {
  return n == null ? '—' : Number(n).toFixed(digits);
}

export function formatMm(n?: number | null): string {
  return n == null ? '—' : `${Number(n).toFixed(1)} mm`;
}

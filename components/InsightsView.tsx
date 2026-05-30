'use client';
import { useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, ErrorBar,
} from 'recharts';
import type { Shoe } from '@/lib/types';
import { formatIdr } from '@/lib/format';

const BRAND_COLORS = [
  '#7dd3fc', '#fca5a5', '#86efac', '#fcd34d', '#c4b5fd', '#f9a8d4',
  '#fdba74', '#a7f3d0', '#fde68a', '#bae6fd', '#fbcfe8', '#ddd6fe',
];

export function InsightsView({ shoes }: { shoes: Shoe[] }) {
  const brands = useMemo(
    () => Array.from(new Set(shoes.map((s) => s.brand))).sort(),
    [shoes],
  );
  const brandColor = (b: string) =>
    BRAND_COLORS[brands.indexOf(b) % BRAND_COLORS.length];

  const herPrice = shoes
    .filter((s) => s.her != null && s.priceIdr)
    .map((s) => ({ x: (s.priceIdr! / 1_000_000), y: s.her!, brand: s.brand, version: s.version }));

  const herWeight = shoes
    .filter((s) => s.her != null && s.weightG != null)
    .map((s) => ({ x: s.weightG!, y: s.her!, brand: s.brand, version: s.version }));

  // Pareto frontier (min weight, max her) — sort by weight ascending and keep increasing HER
  const sorted = [...herWeight].sort((a, b) => a.x - b.x);
  let bestHer = -Infinity;
  const pareto = new Set<string>();
  for (const p of sorted) {
    if (p.y > bestHer) { bestHer = p.y; pareto.add(`${p.brand} ${p.version}`); }
  }

  const byFoam = aggregateMean(shoes, 'foam', 'her');
  const byBrand = aggregateMean(shoes, 'brand', 'her');
  const dropHist = histogram(shoes.map((s) => s.drop).filter((v): v is number => v != null), 1);
  const priceHist = histogram(
    shoes.map((s) => (s.priceIdr ?? 0) / 1_000_000).filter((v) => v > 0), 0.5,
  );

  // Forefoot flare by category (upFoam = mFore - width).
  // Ordered following the community rule of thumb: daily (small) → super → maximalist → megablast (large).
  const FLARE_CAT_ORDER = ['DAILY', 'SUPER', 'MAXIMALIST', 'MEGABLAST', 'RACERS', 'HYPED'];
  const flareByCat = (() => {
    const buckets: Record<string, number[]> = {};
    for (const s of shoes) {
      if (s.upFoam == null) continue;
      for (const c of s.categories ?? []) {
        if (!FLARE_CAT_ORDER.includes(c)) continue;
        (buckets[c] ||= []).push(s.upFoam);
      }
    }
    return FLARE_CAT_ORDER
      .filter((c) => buckets[c]?.length)
      .map((c) => {
        const vs = buckets[c];
        const mean = vs.reduce((a, b) => a + b, 0) / vs.length;
        const min = Math.min(...vs);
        const max = Math.max(...vs);
        return {
          label: `${c} (${vs.length})`,
          mean: +mean.toFixed(1),
          errLo: +(mean - min).toFixed(1),
          errHi: +(max - mean).toFixed(1),
        };
      });
  })();

  return (
    <div className="space-y-10">
      <h1 className="text-xl font-semibold">Insights</h1>

      <Chart title="HER vs Price (color = brand)">
        <ScatterChart>
          <CartesianGrid stroke="#2a2b30" />
          <XAxis type="number" dataKey="x" name="Price (M IDR)" tick={{ fill: '#8a8a93', fontSize: 11 }} />
          <YAxis type="number" dataKey="y" name="HER %" tick={{ fill: '#8a8a93', fontSize: 11 }} />
          <ZAxis range={[40, 40]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ background: '#15161a', border: '1px solid #2a2b30' }}
            formatter={(v: number, n: string) => n === 'x' ? `${v.toFixed(1)} M IDR` : `${v}%`}
            labelFormatter={() => ''}
          />
          {brands.map((b) => (
            <Scatter
              key={b} name={b} fill={brandColor(b)}
              data={herPrice.filter((p) => p.brand === b)}
            />
          ))}
        </ScatterChart>
      </Chart>

      <Chart title="HER vs Weight (Pareto frontier highlighted)">
        <ScatterChart>
          <CartesianGrid stroke="#2a2b30" />
          <XAxis type="number" dataKey="x" name="Weight (g)" tick={{ fill: '#8a8a93', fontSize: 11 }} />
          <YAxis type="number" dataKey="y" name="HER %" tick={{ fill: '#8a8a93', fontSize: 11 }} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ background: '#15161a', border: '1px solid #2a2b30' }}
          />
          <Scatter
            name="Shoes"
            data={herWeight.map((p) => ({ ...p, fill: pareto.has(`${p.brand} ${p.version}`) ? '#7dd3fc' : '#3f3f46' }))}
          >
            {herWeight.map((p, i) => (
              <Cell key={i} fill={pareto.has(`${p.brand} ${p.version}`) ? '#7dd3fc' : '#3f3f46'} />
            ))}
          </Scatter>
        </ScatterChart>
      </Chart>

      <Chart title="Average HER by foam type (with sample size)">
        <BarChart data={byFoam} margin={{ bottom: 10 }}>
          <CartesianGrid stroke="#2a2b30" />
          <XAxis dataKey="label" tick={{ fill: '#8a8a93', fontSize: 11 }} interval={0} angle={-20} dy={6} height={60} />
          <YAxis tick={{ fill: '#8a8a93', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: '#15161a', border: '1px solid #2a2b30' }} />
          <Bar dataKey="mean" name="avg HER %" fill="#7dd3fc" />
        </BarChart>
      </Chart>

      <Chart title="Average HER by brand (with sample size)">
        <BarChart data={byBrand} margin={{ bottom: 10 }}>
          <CartesianGrid stroke="#2a2b30" />
          <XAxis dataKey="label" tick={{ fill: '#8a8a93', fontSize: 11 }} interval={0} angle={-30} dy={10} height={70} />
          <YAxis tick={{ fill: '#8a8a93', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: '#15161a', border: '1px solid #2a2b30' }} />
          <Bar dataKey="mean" name="avg HER %" fill="#86efac" />
        </BarChart>
      </Chart>

      <Chart title="Drop distribution (mm)">
        <BarChart data={dropHist}>
          <CartesianGrid stroke="#2a2b30" />
          <XAxis dataKey="bin" tick={{ fill: '#8a8a93', fontSize: 11 }} />
          <YAxis tick={{ fill: '#8a8a93', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: '#15161a', border: '1px solid #2a2b30' }} />
          <Bar dataKey="count" fill="#fcd34d" />
        </BarChart>
      </Chart>

      <Chart title="Price distribution (M IDR)">
        <BarChart data={priceHist}>
          <CartesianGrid stroke="#2a2b30" />
          <XAxis dataKey="bin" tick={{ fill: '#8a8a93', fontSize: 11 }} />
          <YAxis tick={{ fill: '#8a8a93', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: '#15161a', border: '1px solid #2a2b30' }} formatter={(v, _n, p) => [v, `~${p.payload.bin} M IDR`]} />
          <Bar dataKey="count" fill="#fca5a5" />
        </BarChart>
      </Chart>

      {flareByCat.length > 0 && (
        <Chart title="Forefoot flare by category — mean ± min/max (mm)">
          <BarChart data={flareByCat} margin={{ bottom: 10 }}>
            <CartesianGrid stroke="#2a2b30" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#8a8a93', fontSize: 11 }}
              interval={0}
              angle={-15}
              dy={6}
              height={50}
            />
            <YAxis tick={{ fill: '#8a8a93', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#15161a', border: '1px solid #2a2b30' }}
              formatter={(v) => [`${v} mm`, 'mean flare']}
            />
            <Bar dataKey="mean" fill="#c4b5fd">
              <ErrorBar
                dataKey="errHi"
                width={6}
                strokeWidth={1.5}
                stroke="#8a8a93"
                direction="y"
              />
            </Bar>
          </BarChart>
        </Chart>
      )}
    </div>
  );
}

function Chart({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <section>
      <h2 className="text-sm uppercase tracking-wider text-muted mb-2">{title}</h2>
      <div className="border border-line rounded bg-panel p-2 h-[360px]">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </section>
  );
}

function aggregateMean(shoes: Shoe[], groupKey: keyof Shoe, valueKey: keyof Shoe) {
  const buckets: Record<string, number[]> = {};
  for (const s of shoes) {
    const g = s[groupKey];
    const v = s[valueKey];
    if (!g || typeof v !== 'number') continue;
    (buckets[g as string] ||= []).push(v);
  }
  return Object.entries(buckets)
    .map(([k, vs]) => ({
      label: `${k} (${vs.length})`,
      mean: +(vs.reduce((a, b) => a + b, 0) / vs.length).toFixed(1),
    }))
    .sort((a, b) => b.mean - a.mean);
}

function histogram(values: number[], step: number) {
  if (!values.length) return [];
  const min = Math.floor(Math.min(...values) / step) * step;
  const max = Math.ceil(Math.max(...values) / step) * step;
  const bins: { bin: string; count: number }[] = [];
  for (let x = min; x <= max; x += step) {
    bins.push({ bin: x.toFixed(step < 1 ? 1 : 0), count: 0 });
  }
  for (const v of values) {
    const idx = Math.floor((v - min) / step);
    if (bins[idx]) bins[idx].count++;
  }
  return bins;
}

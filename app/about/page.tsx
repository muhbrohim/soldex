import Link from 'next/link';
import { meta } from '@/lib/data';

export default function AboutPage() {
  return (
    <article className="prose prose-invert max-w-3xl">
      <h1 className="text-2xl font-semibold">About Soldex</h1>
      <p className="text-muted">
        Soldex (Sole Index) is a private, data-first browsing layer over a
        personal spreadsheet of running-shoe measurements. It is not a review
        site, not a recommender, and intentionally has no opinions.
      </p>
      <p className="text-xs text-muted">
        Data generated on <code>{meta.generatedAt}</code> · {meta.shoeCount} shoes ·{' '}
        {meta.brands.length} brands
      </p>

      <h2 className="text-lg font-semibold mt-8">Field legend</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-line">
          <thead className="bg-panel">
            <tr>
              <th className="text-left p-2 border-b border-line">Field</th>
              <th className="text-left p-2 border-b border-line">Meaning</th>
            </tr>
          </thead>
          <tbody>
            {LEGEND.map(([k, v]) => (
              <tr key={k} className="border-b border-line/60">
                <td className="p-2 font-mono text-accent">{k}</td>
                <td className="p-2 text-ink">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold mt-8">Disclaimer</h2>
      <p className="text-muted">
        Measurements are personal and the methodology is informal. Use as
        directional, not absolute. Prices are in IDR and reflect the owner&apos;s
        local-market reference at time of entry.
      </p>

      <p className="mt-8">
        <Link href="/" className="text-accent hover:underline">← Back to browse</Link>
      </p>
    </article>
  );
}

const LEGEND: [string, string][] = [
  ['HER / FER', 'Heel / Forefoot Energy Return (%)'],
  ['HSA / FSA', 'Heel / Forefoot Shock Absorption'],
  ['W', 'Weight, US M9, grams'],
  ['Pr', 'Price in IDR'],
  ['Heel / Fore', 'Stack heights in mm'],
  ['DROP', 'Heel-to-toe drop in mm'],
  ['Width / Toe', 'Last and toebox geometry'],
  ['m-fore', 'Midfoot/forefoot measurement'],
  ['o-thick / drem', 'Outsole thickness, remaining wear depth'],
  ['o-dur% / o-stay', 'Outsole durability %, stay-on-foam score'],
  ['TRAC', 'Traction score (0–1)'],
  ['m-soft', 'Midsole softness'],
  ['flexStiff / torsRigid', 'Longitudinal & torsional stiffness'],
  ['FOAM', 'Midsole foam family'],
  ['up-foam', 'Upper-foam metric'],
  ['Type', 'R race · D daily · DC daily-cushion · C cushion · S speed · M maximalist'],
  ['avgEr / avgSa', 'Derived averages of HER/FER and HSA/FSA'],
  ['valueIdx', 'avgEr per million IDR — higher = better value'],
];

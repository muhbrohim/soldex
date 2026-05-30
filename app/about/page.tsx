import Link from 'next/link';
import { meta } from '@/lib/data';
import {
  ALL_COLUMNS,
  COLUMN_META,
  COLUMN_GROUP_LABEL,
  type ColumnGroup,
} from '@/lib/columns';

export default function AboutPage() {
  const groups = (Object.keys(COLUMN_GROUP_LABEL) as ColumnGroup[]).map((g) => ({
    group: g,
    rows: ALL_COLUMNS.filter((k) => COLUMN_META[k].group === g),
  }));

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

      <p>
        For the long version see the <Link href="/docs" className="text-accent">Docs</Link> —
        specifically <Link href="/docs/methodology" className="text-accent">methodology</Link>,{' '}
        <Link href="/docs/metrics" className="text-accent">metrics</Link>, and the{' '}
        <Link href="/docs/faq" className="text-accent">FAQ</Link>.
      </p>

      <h2 className="text-lg font-semibold mt-8">Field legend</h2>
      <p className="text-muted text-sm">
        Every column in the browse table, grouped. Click a row to read the full
        explanation.
      </p>

      <div className="not-prose space-y-5">
        {groups.map((g) => (
          <section key={g.group}>
            <h3 className="text-sm uppercase tracking-wider text-muted mb-2">
              {COLUMN_GROUP_LABEL[g.group]}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-line">
                <thead className="bg-panel text-muted text-xs">
                  <tr>
                    <th className="text-left p-2 border-b border-line w-44">Field</th>
                    <th className="text-left p-2 border-b border-line w-24">Code</th>
                    <th className="text-left p-2 border-b border-line">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((k) => {
                    const m = COLUMN_META[k];
                    return (
                      <tr key={k} className="border-b border-line/60">
                        <td className="p-2 text-ink">
                          <Link
                            href={`/docs/metrics#${k}`}
                            className="hover:text-accent"
                          >
                            {m.label}
                          </Link>
                        </td>
                        <td className="p-2 font-mono text-xs text-muted">
                          {m.code ?? '—'}
                        </td>
                        <td className="p-2 text-ink/90 text-sm">{m.tip}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-10">Easily-confused pairs</h2>
      <ul className="text-sm">
        <li>
          <Link href="/docs/metrics#bend-vs-twist" className="text-accent">
            Bend stiffness vs Twist rigidity
          </Link>{' '}
          — longitudinal vs torsional.
        </li>
        <li>
          <Link href="/docs/metrics#durability-vs-bond" className="text-accent">
            Outsole durability vs bond
          </Link>{' '}
          — quantity of rubber vs quality of glue.
        </li>
        <li>
          <Link href="/docs/metrics#er-vs-sa" className="text-accent">
            Energy return vs shock absorption
          </Link>{' '}
          — what comes back vs what is dampened away.
        </li>
        <li>
          <Link href="/docs/metrics#flare" className="text-accent">
            Midsole vs upper vs flare
          </Link>{' '}
          — the three forefoot-width numbers.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-8">Disclaimer</h2>
      <p className="text-muted">
        Measurements are personal and the methodology is informal. Use as
        directional, not absolute. Prices are in IDR and reflect the owner&apos;s
        local-market reference at time of entry.
      </p>

      <p className="mt-8">
        <Link href="/" className="text-accent hover:underline">
          ← Back to browse
        </Link>
      </p>
    </article>
  );
}

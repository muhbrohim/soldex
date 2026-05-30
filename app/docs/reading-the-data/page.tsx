import Link from 'next/link';

export const metadata = { title: 'Reading the data · Soldex Docs' };

export default function ReadingPage() {
  return (
    <article className="max-w-3xl prose prose-invert">
      <p className="text-xs text-muted">
        <Link href="/docs" className="hover:text-ink">
          ← Docs
        </Link>
      </p>
      <h1 className="text-2xl font-semibold">Reading the data</h1>
      <p className="text-muted">
        How to interpret each section of the site without over-reading the
        noise.
      </p>

      <h2 className="text-lg font-semibold mt-8" id="browse">
        Browse table
      </h2>
      <p>
        The main table on the home page. Each row is one shoe; columns are the
        metrics from{' '}
        <Link href="/docs/metrics" className="text-accent">
          Metrics
        </Link>
        . Hover any column header for a quick definition; click the ⓘ icon to
        deep-link to the full explanation.
      </p>
      <ul>
        <li>
          Click any header to sort by that column. Click again to flip
          direction.
        </li>
        <li>
          Use the <strong>Columns</strong> picker on the right to show or hide
          fields. Your choice is remembered in your browser (localStorage,
          per-device).
        </li>
        <li>
          The sidebar filters (brand, type, foam, sheet, price/weight/HER/drop
          ranges) are AND-combined — a shoe must match every active filter to
          appear.
        </li>
        <li>
          A dash (<code>—</code>) means the measurement was not recorded for
          that shoe, not a zero.
        </li>
        <li>
          Check the box at the left of any row to add it to the floating
          compare cart at the bottom of the screen (max 4).
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-8" id="compare">
        Compare page
      </h2>
      <p>
        Up to 4 shoes side-by-side. Three views, top to bottom:
      </p>
      <ul>
        <li>
          <strong>Cards</strong> — brand, model, price, weight, drop at a
          glance.
        </li>
        <li>
          <strong>Radar</strong> — every axis is normalized 0–1 against a fixed
          ceiling, so the SHAPE of the polygon matters more than its size. A
          shoe with a small overall polygon is not necessarily a worse shoe —
          it may just measure low on these specific axes.
        </li>
        <li>
          <strong>Diff table</strong> — best value per row is highlighted in
          accent color. “Best” means highest for things like ER and value, and
          lowest for things like weight and price. Some rows (drop, midsole
          softness, bend stiffness, flare) are tagged neutral — no shoe is
          highlighted because higher is not universally better.
        </li>
      </ul>
      <p>
        The URL updates with <code>?ids=…</code> when you share. Anyone opening
        that link sees the same comparison.
      </p>

      <h2 className="text-lg font-semibold mt-8" id="insights">
        Insights charts
      </h2>
      <p>
        A handful of standard charts to spot patterns across the whole
        dataset.
      </p>
      <ul>
        <li>
          <strong>HER vs Price</strong> — does more rupiah buy more bounce?
          Mostly yes, with notable outliers.
        </li>
        <li>
          <strong>HER vs Weight (Pareto)</strong> — highlighted points are on
          the Pareto frontier: no other shoe is both lighter and bouncier.
          Everything else is dominated by at least one shoe.
        </li>
        <li>
          <strong>Average HER by foam / brand</strong> — the number in
          parentheses is the sample size. A foam with <code>(3)</code> is far
          less trustworthy than one with <code>(40)</code>.
        </li>
        <li>
          <strong>Drop / Price distributions</strong> — shape of the dataset.
          Useful for spotting that, e.g., most shoes here cluster around 8–10
          mm drop.
        </li>
        <li>
          <strong>Forefoot flare by category</strong> — mean flare per sheet
          category, with whiskers showing the spread. Confirms (or denies) the
          rule of thumb that daily trainers run smaller flare and max/super
          shoes run larger.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-8">Things to keep in mind</h2>
      <ul>
        <li>
          With only 174 shoes, sample sizes per brand/foam/category are small.
          One outlier moves the average a lot.
        </li>
        <li>
          A shoe is good or bad for <em>you</em>, not in absolute terms. These
          numbers describe properties; what to do with them is your call.
        </li>
        <li>
          If a number surprises you, check the methodology and the “owner
          notes” on the shoe detail page before assuming the data is wrong (or
          right).
        </li>
      </ul>
    </article>
  );
}

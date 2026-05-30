import Link from 'next/link';

export const metadata = { title: 'Methodology · Soldex Docs' };

export default function MethodologyPage() {
  return (
    <article className="max-w-3xl prose prose-invert">
      <p className="text-xs text-muted">
        <Link href="/docs" className="hover:text-ink">
          ← Docs
        </Link>
      </p>
      <h1 className="text-2xl font-semibold">Methodology</h1>
      <p className="text-muted">
        Soldex is built on top of one person’s spreadsheet of running-shoe
        measurements. It is not a peer-reviewed lab dataset, and it does not
        pretend to be one. Read this page first if you want to know what the
        numbers actually represent before you start drawing conclusions from
        them.
      </p>

      <h2 className="text-lg font-semibold mt-8">Where the data comes from</h2>
      <p>
        Every row in this site originates from a manual test the owner performs
        on each shoe before adding it to the sheet. The protocol is informal
        but consistent across shoes — meaning relative comparisons between two
        shoes are usually more meaningful than absolute numbers. A shoe with{' '}
        <span className="font-mono">HER&nbsp;=&nbsp;70</span> is bouncier in the
        heel than one at <span className="font-mono">HER&nbsp;=&nbsp;55</span>,
        but “70%” is not a lab-grade rebound coefficient. Treat it as a
        repeatable score, not a universal physical constant.
      </p>

      <h2 className="text-lg font-semibold mt-8">What is measured</h2>
      <ul>
        <li>
          <strong>Energy return (HER, FER)</strong> — how much energy the
          midsole gives back at the heel and forefoot, expressed as a percent
          of input.
        </li>
        <li>
          <strong>Shock absorption (HSA, FSA)</strong> — how much impact energy
          is dampened (not returned). HER and HSA are independent: a shoe can
          be bouncy <em>and</em> cushioned, or harsh <em>and</em> dead.
        </li>
        <li>
          <strong>Geometry</strong> — stack heights at heel and forefoot, drop,
          midsole and upper widths, toebox, outsole thickness. Measured with
          calipers on the actual shoe.
        </li>
        <li>
          <strong>Outsole</strong> — durability percent (rubber surviving the
          wear test) and bond score (how well the outsole stays attached to
          the midsole over use). These are two separate things; see{' '}
          <Link href="/docs/metrics#oDurPct" className="text-accent">
            outsole durability vs bond
          </Link>
          .
        </li>
        <li>
          <strong>Feel</strong> — midsole softness, bend stiffness
          (longitudinal), torsional rigidity (medial-to-lateral).
        </li>
        <li>
          <strong>Traction</strong> — grip score on the owner’s standard test
          surface, 0–1.
        </li>
        <li>
          <strong>Price</strong> — retail price in Indonesian Rupiah at the
          time the shoe was added.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-8">What is <em>not</em> measured</h2>
      <ul>
        <li>Comfort, fit, breathability — too subjective for this dataset.</li>
        <li>Long-term durability beyond the wear-test snapshot.</li>
        <li>Running economy or VO₂ data — out of scope.</li>
        <li>
          Brand “feel,” intended distance, or marketing category — that is
          what the owner-assigned <code>type</code> tag is for, and even that
          is opinion.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-8">Caveats</h2>
      <ul>
        <li>
          Not every shoe has every measurement. Geometry fields in particular
          (width, toebox, outsole thickness, flare) cover ~30% of shoes — the
          rest are filtered out of geometry-dependent charts.
        </li>
        <li>
          Prices are owner’s reference at entry time. They drift, they vary by
          region, and some grey-import shoes never had a clean Indonesian
          retail price.
        </li>
        <li>
          Brand spellings come from the original sheet. You may see{' '}
          <code>ON</code> and <code>On</code> as separate entries — that is a
          data-quality artifact, not two different brands.
        </li>
        <li>
          There is intentionally <strong>no overall rating</strong> on this
          site. See the <Link href="/docs/faq" className="text-accent">FAQ</Link> for
          why.
        </li>
      </ul>

      <p className="mt-8 text-xs text-muted">
        Have a question this page doesn’t answer? Open an issue on the repo or
        message the owner.
      </p>
    </article>
  );
}

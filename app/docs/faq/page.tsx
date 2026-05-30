import Link from 'next/link';

export const metadata = { title: 'FAQ · Soldex Docs' };

const QA: { q: string; a: React.ReactNode }[] = [
  {
    q: 'Why is there no overall rating?',
    a: (
      <>
        Because there is no single number that captures whether a shoe is
        right for you. A great marathon racer is a bad easy-day shoe; a great
        easy-day shoe is a bad race shoe. Soldex deliberately exposes the
        underlying measurements so you can apply your own weights. If you want
        a quick proxy, sort by <code>avg ER</code> (overall bounce) or{' '}
        <code>Value / Mio Rp</code> (bounce per rupiah), but treat both as
        starting points, not verdicts.
      </>
    ),
  },
  {
    q: 'Is shoe X any good?',
    a: (
      <>
        Soldex doesn’t answer that. It tells you how shoe X compares to other
        shoes on specific measurements. Open the shoe detail page, look at the
        “similar shoes” section, and read the “owner notes” block at the
        bottom if it’s populated.
      </>
    ),
  },
  {
    q: 'Why is the price missing for so many shoes?',
    a: (
      <>
        About 113 of 174 shoes don’t have a price on record. Reasons:
        grey-import items without a clean Indonesian retail price, shoes
        gifted/lent for measurement, or simply rows the owner hasn’t backfilled
        yet. Missing price means the shoe is excluded from price-dependent
        sorts and from the Value / Mio Rp ranking.
      </>
    ),
  },
  {
    q: 'Why are some brands listed twice (e.g. ON and On)?',
    a: (
      <>
        That’s a data-quality artifact from the source spreadsheet — same
        brand, two spellings. Will be fixed in a future cleanup pass. Treat
        them as the same brand.
      </>
    ),
  },
  {
    q: 'What does “Forefoot flare” actually mean?',
    a: (
      <>
        It is the difference between the midsole forefoot width and the upper
        forefoot width, in mm. Positive numbers mean the midsole sticks out
        past the upper, giving a wider, more planted platform. Negative
        numbers (rare here) mean the midsole tucks under the upper for a more
        agile feel. See{' '}
        <Link href="/docs/metrics#flare" className="text-accent">
          midsole vs upper vs flare
        </Link>{' '}
        for the diagram.
      </>
    ),
  },
  {
    q: 'Why are flexStiff and torsRigid separate?',
    a: (
      <>
        Because they measure perpendicular directions. flexStiff is bending
        toe-to-heel (a carbon plate makes this high). torsRigid is twisting
        side-to-side (a torsion bar or full-length plate makes this high). A
        shoe can be stiff in one direction and soft in the other. See{' '}
        <Link href="/docs/metrics#bend-vs-twist" className="text-accent">
          bend vs twist
        </Link>
        .
      </>
    ),
  },
  {
    q: 'Why do o-dur% and o-stay both exist?',
    a: (
      <>
        Different failure modes. o-dur% tells you whether the rubber will go
        bald (quantity surviving). o-stay tells you whether the rubber will
        peel off (quality of the bond). A shoe can be fine on one and fail on
        the other. See{' '}
        <Link href="/docs/metrics#durability-vs-bond" className="text-accent">
          durability vs bond
        </Link>
        .
      </>
    ),
  },
  {
    q: 'Can I use HER to predict marathon performance?',
    a: (
      <>
        No. HER is one of many factors that go into actual running economy,
        and the relationship is not linear. Use it for relative comparison
        within this dataset, not for race-time predictions.
      </>
    ),
  },
  {
    q: 'My favorite shoe is missing — can I add it?',
    a: (
      <>
        Data is collected by the owner from physical shoes in their
        possession. If you want a specific shoe added, lend it to them for a
        few days.
      </>
    ),
  },
  {
    q: 'Why does the dark mode have no light mode?',
    a: <>Dark is the only mode. Light mode would require a second design pass that hasn’t been done.</>,
  },
  {
    q: 'Where is the data file?',
    a: (
      <>
        The generated JSON lives in <code>public/data/</code> in the
        repository. The source spreadsheet lives in <code>data/</code>. The
        ETL script that turns one into the other is{' '}
        <code>scripts/build_data.py</code>.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <article className="max-w-3xl">
      <p className="text-xs text-muted mb-2">
        <Link href="/docs" className="hover:text-ink">
          ← Docs
        </Link>
      </p>
      <h1 className="text-2xl font-semibold mb-2">FAQ</h1>
      <p className="text-muted mb-6 text-sm">
        Common questions, answered honestly.
      </p>
      <div className="space-y-5">
        {QA.map((item, i) => (
          <section key={i} className="border-b border-line/60 pb-5">
            <h2 className="text-ink font-medium text-base">{item.q}</h2>
            <div className="text-muted text-sm mt-2 leading-relaxed">{item.a}</div>
          </section>
        ))}
      </div>
    </article>
  );
}

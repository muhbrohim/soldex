import Link from 'next/link';
import {
  ALL_COLUMNS,
  COLUMN_META,
  COLUMN_GROUP_LABEL,
  type ColumnGroup,
  type ColumnKey,
} from '@/lib/columns';

export const metadata = { title: 'Metrics · Soldex Docs' };

// Long-form expansions for the metrics that confuse people most.
// Anything not listed here uses the COLUMN_META.tip as the body.
const EXTRA: Partial<Record<ColumnKey, string>> = {
  her:
    'Drop a small steel ball on the heel from a fixed height and measure how high it bounces back. HER is the bounce height as a percent of drop height. Higher numbers feel snappier on landing. Live range in this dataset: ~44–81%.',
  fer:
    'Same test as HER, applied at the forefoot. Tells you how much push the shoe gives back when you roll off the front. Live range: ~46–82%.',
  hsa:
    'Energy that disappears into the midsole on heel impact — heat, sound, deformation. The opposite of HER. A pillowy max-cushion daily will score high HSA but may have modest HER. A firm racing flat is often the reverse. HER and HSA do not have to sum to 100 because some energy is also lost to your body, the ground, and the shoe’s upper.',
  fsa:
    'Forefoot equivalent of HSA. High FSA = soft, dampened push-off. Low FSA = firm and direct.',
  flexStiff:
    'Hold the heel, press the forefoot toward the heel until it bends. The resistance you feel is bend stiffness — the longitudinal direction, toe-to-heel. Carbon-plated super-shoes score high here. This is NOT the same as twist rigidity below.',
  torsRigid:
    'Hold the heel and forefoot in your hands and twist them in opposite directions, like wringing a towel. The resistance is torsional rigidity — the medial-to-lateral direction, side-to-side. A shoe can be very stiff longitudinally (flexStiff high) but soft torsionally (torsRigid low) and vice versa. They measure different things.',
  oDurPct:
    'After the wear test, what percent of the original outsole rubber is still there? This is the QUANTITY of rubber surviving. It tells you whether the shoe will go bald or not. A shoe with thin pads of soft race rubber can score low here even if the rubber itself is high quality.',
  oStay:
    'A separate question: does the rubber stay glued to the midsole, or does it peel and chunk off? This is the QUALITY of the bond. A shoe can have plenty of rubber left (high o-dur%) but score low here if pieces start delaminating. Treat o-dur% and o-stay as orthogonal — both matter, neither replaces the other.',
  trac:
    'Grip score on the owner’s standard test surface, normalized 0–1. Useful for relative comparison between shoes in this dataset; not directly comparable to other testers’ numbers.',
  mSoft:
    'How much the midsole compresses under a fixed load. Higher = squishier underfoot. This is independent of bounce — a soft foam can be lively (high HER) or dead (low HER).',
  mFore:
    'Width of the midsole platform at the forefoot, measured in mm with calipers. This is the size of the “floor” you stand on at the front.',
  width:
    'Width of the upper at the forefoot, in mm. Where your foot actually sits. Usually narrower than the midsole — the midsole flares out beyond the upper for stability.',
  upFoam:
    'mFore minus width. How far the midsole flares out past the upper, in mm. Positive numbers mean a wider, more planted platform. Negative numbers (rare in this dataset) mean the midsole is tucked under the upper for a more agile, tippy feel. Community rule of thumb: daily/easy trainers tend toward smaller flare; max-cushion and super-shoes tend toward larger flare to compensate for tall stacks and soft foams. This is descriptive, not a score.',
  drop:
    'Heel stack minus forefoot stack, in mm. Lower-drop shoes shift more load to the calf and Achilles; higher-drop shoes shift more to the knee. Neither is universally better.',
  drem:
    'Effective drop after the midsole compresses under your weight. A 10 mm drop with very soft foam might land at 6 mm dynamic drop. This number tries to capture what your foot actually experiences when standing on the shoe.',
  valueIdx:
    'Average ER divided by price in millions of IDR. A composite shorthand for "performance per rupiah" — not a recommendation. A cheap shoe with mediocre numbers can score higher than a great shoe at full retail. Always look at the underlying ER and price separately too.',
  herMinusFer:
    'Positive numbers mean the heel is bouncier than the forefoot — heel-strike runners often prefer this profile. Negative numbers mean the forefoot is bouncier — forefoot/midfoot strikers often prefer this. Magnitude matters: ±2 is balanced, ±10+ is a strong character.',
};

const CONFUSION_PAIRS: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: 'bend-vs-twist',
    title: 'Bend stiffness vs Twist rigidity',
    body: (
      <>
        <p>
          These two are constantly confused. They measure perpendicular
          directions of the same midsole.
        </p>
        <ul>
          <li>
            <strong>Bend stiffness (flexStiff)</strong> — resistance to bending
            in the toe-to-heel direction. A carbon plate makes this very high.
          </li>
          <li>
            <strong>Twist rigidity (torsRigid)</strong> — resistance to twisting
            in the side-to-side direction. A torsion bar or full-length plate
            adds this; foam alone usually doesn’t.
          </li>
        </ul>
        <p>
          A shoe can be stiff one way and soft the other. Most carbon racers
          are stiff in both. Many maximalist daily trainers are stiff
          torsionally (for stability) but soft longitudinally (for comfort).
        </p>
      </>
    ),
  },
  {
    id: 'durability-vs-bond',
    title: 'Outsole durability vs Outsole bond',
    body: (
      <>
        <p>
          Both relate to how long the bottom of your shoe lasts, but they fail
          in different ways.
        </p>
        <ul>
          <li>
            <strong>Outsole durability % (o-dur%)</strong> — how much rubber is
            still there after wear. Failure mode: bald patches, exposed foam.
          </li>
          <li>
            <strong>Outsole bond (o-stay)</strong> — how well the rubber stays
            glued to the midsole. Failure mode: rubber pads peel off in chunks
            while still mostly intact.
          </li>
        </ul>
        <p>
          Soft, sticky race rubber often scores low on durability but fine on
          bond. Some daily trainers go the opposite way — plenty of hard rubber
          left, but it starts lifting at the edges. Look at both numbers.
        </p>
      </>
    ),
  },
  {
    id: 'er-vs-sa',
    title: 'Energy Return vs Shock Absorption',
    body: (
      <>
        <p>
          ER and SA describe what happens to impact energy after your foot
          lands.
        </p>
        <ul>
          <li>
            <strong>Energy Return (HER / FER)</strong> — energy that comes
            back, pushing you forward.
          </li>
          <li>
            <strong>Shock Absorption (HSA / FSA)</strong> — energy that gets
            dampened away into the foam, never returning.
          </li>
        </ul>
        <p>
          These do not sum to 100. The remaining energy goes elsewhere — into
          your body, the ground, the upper, sound, heat. A shoe can score high
          on both (rare — a “magic” foam), high on one and low on the other
          (most shoes), or low on both (a dead-feeling shoe).
        </p>
      </>
    ),
  },
  {
    id: 'flare',
    title: 'Midsole width vs Upper width vs Flare',
    body: (
      <>
        <p>
          Three numbers describe the forefoot footprint:
        </p>
        <pre className="text-xs text-muted overflow-x-auto">
{`        ┌──────────────┐         <- midsole fore (mFore)
        │   ┌──────┐   │          <- upper fore (width)
        │   │ foot │   │
        │   └──────┘   │
        └──────────────┘

   flare (upFoam) = mFore - width`}
        </pre>
        <p>
          <strong>Positive flare</strong> — midsole sticks out past the upper,
          giving a wider, more planted platform. Common on max-cushion and
          super shoes where the tall stack needs lateral stability.
        </p>
        <p>
          <strong>Smaller flare</strong> — midsole hugs the upper more closely,
          giving a more agile, foot-shaped feel. Common on daily trainers and
          racers where you want responsiveness over stability.
        </p>
        <p className="text-muted">
          Rule of thumb (community, not a score): DAILY → smaller flare,
          SUPER / MAXIMALIST / MEGABLAST → larger flare. Outliers are
          interesting, not wrong.
        </p>
      </>
    ),
  },
];

export default function MetricsPage() {
  // Group columns by group for the in-page TOC.
  const groups = (Object.keys(COLUMN_GROUP_LABEL) as ColumnGroup[]).map((g) => ({
    group: g,
    cols: ALL_COLUMNS.filter((k) => COLUMN_META[k].group === g),
  }));

  return (
    <article className="max-w-3xl prose prose-invert">
      <p className="text-xs text-muted">
        <Link href="/docs" className="hover:text-ink">
          ← Docs
        </Link>
      </p>
      <h1 className="text-2xl font-semibold">Metrics</h1>
      <p className="text-muted">
        Every column in the browse table, explained. Anchor links match the
        “Learn more →” links inside the column tooltips.
      </p>

      <h2 className="text-lg font-semibold mt-8">Pairs that get confused</h2>
      <p className="text-muted text-sm">
        Read these four first — they cover ~80% of the questions friends ask.
      </p>
      <div className="not-prose space-y-4 mt-2">
        {CONFUSION_PAIRS.map((p) => (
          <section
            key={p.id}
            id={p.id}
            className="border border-line rounded p-4 bg-panel/40"
          >
            <h3 className="text-base font-medium text-ink">{p.title}</h3>
            <div className="text-sm text-ink/90 space-y-2 mt-2">{p.body}</div>
          </section>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-10">All columns</h2>
      {groups.map((g) => (
        <section key={g.group} className="mt-6">
          <h3 className="text-base font-medium text-ink">
            {COLUMN_GROUP_LABEL[g.group]}
          </h3>
          <div className="not-prose mt-2 space-y-3">
            {g.cols.map((k) => {
              const m = COLUMN_META[k];
              const extra = EXTRA[k];
              return (
                <div
                  key={k}
                  id={k}
                  className="border border-line rounded p-3 bg-bg scroll-mt-20"
                >
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span className="text-ink font-medium">{m.label}</span>
                    {m.code && (
                      <span className="text-[10px] uppercase tracking-wider text-muted font-mono">
                        code: {m.code}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted mt-1">{m.tip}</p>
                  {extra && (
                    <p className="text-sm text-ink/90 mt-2">{extra}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <p className="mt-10 text-xs text-muted">
        Missing something? Update{' '}
        <code>lib/columns.ts</code> (the single source of truth) and this page
        regenerates automatically.
      </p>
    </article>
  );
}

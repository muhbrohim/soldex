import Link from 'next/link';

export const metadata = { title: 'Glossary · Soldex Docs' };

const TERMS: { term: string; def: string; href?: string }[] = [
  { term: 'avg ER', def: 'Average of HER and FER. A single overall bounce number.', href: '/docs/metrics#avgEr' },
  { term: 'avg SA', def: 'Average of HSA and FSA. Overall cushioning.', href: '/docs/metrics#avgSa' },
  { term: 'Bend stiffness', def: 'Longitudinal (toe-to-heel) bending resistance of the midsole. See "flexStiff".', href: '/docs/metrics#flexStiff' },
  { term: 'Bond (outsole)', def: 'How well the outsole rubber stays glued to the midsole over use. See "o-stay".', href: '/docs/metrics#oStay' },
  { term: 'Carbon plate', def: 'A stiff plate embedded in the midsole, usually to raise bend stiffness and create a propulsive feel. Strongly affects flexStiff.' },
  { term: 'Daily (D)', def: 'A trainer for everyday miles — balanced cushion, moderate weight, durable outsole. The default workhorse.' },
  { term: 'Drop', def: 'Heel stack minus forefoot stack, in mm. Affects which part of your leg takes the load.', href: '/docs/metrics#drop' },
  { term: 'Drop remaining (drem)', def: 'Effective drop after the midsole compresses under load.', href: '/docs/metrics#drem' },
  { term: 'Durability % (outsole)', def: 'Percent of outsole rubber surviving the wear test. The QUANTITY of rubber left. See "o-dur%".', href: '/docs/metrics#oDurPct' },
  { term: 'Energy Return (ER)', def: 'Percent of impact energy the midsole gives back. Measured at heel (HER) and forefoot (FER).', href: '/docs/metrics#er-vs-sa' },
  { term: 'EVA', def: 'Ethylene-vinyl acetate. The classic, cheap, slightly dead-feeling running-shoe foam.' },
  { term: 'FER', def: 'Forefoot Energy Return %. How bouncy the forefoot is.', href: '/docs/metrics#fer' },
  { term: 'flexStiff', def: 'Bend stiffness — longitudinal bending resistance. NOT the same as torsRigid.', href: '/docs/metrics#flexStiff' },
  { term: 'Flare (forefoot)', def: 'How far the midsole forefoot sticks out past the upper, in mm. Stored as up-foam in the data. Positive = wider/planted.', href: '/docs/metrics#upFoam' },
  { term: 'Foam', def: 'The primary midsole compound. PEBA, eTPU, EVA, etc.', href: '/docs/metrics#foam' },
  { term: 'Fore (stack)', def: 'Midsole thickness under the forefoot.', href: '/docs/metrics#fore' },
  { term: 'HER', def: 'Heel Energy Return %. How bouncy the heel is.', href: '/docs/metrics#her' },
  { term: 'HER − FER', def: 'Heel bounce minus forefoot bounce. Positive = heel-strike friendly, negative = forefoot friendly.', href: '/docs/metrics#herMinusFer' },
  { term: 'Heel (stack)', def: 'Midsole thickness under the heel.', href: '/docs/metrics#heel' },
  { term: 'HSA', def: 'Heel Shock Absorption. How much heel impact is dampened (not returned).', href: '/docs/metrics#hsa' },
  { term: 'FSA', def: 'Forefoot Shock Absorption.', href: '/docs/metrics#fsa' },
  { term: 'IDR', def: 'Indonesian Rupiah. All prices on this site are in IDR.' },
  { term: 'jt', def: '"juta" — Indonesian for million. "Rp 3 jt" = 3 million IDR.' },
  { term: 'Last', def: 'The foot-shaped form a shoe is built around. Width/toe measurements describe the upper geometry which follows the last.' },
  { term: 'Maximalist (M)', def: 'Very tall stack, very soft foam, designed for cruising at easy pace with maximum protection.' },
  { term: 'mFore', def: 'Midsole forefoot width in mm. The size of the platform under your forefoot.', href: '/docs/metrics#mFore' },
  { term: 'm-soft', def: 'Midsole softness. How much the foam compresses under load.', href: '/docs/metrics#mSoft' },
  { term: 'PEBA', def: 'Polyether block amide. A light, lively foam family used in most modern super-shoes (e.g. Pebax).' },
  { term: 'Plate', def: 'A stiff layer embedded in the midsole. Carbon, glass, nylon, TPU — each gives a different bend feel.' },
  { term: 'Race (R)', def: 'A shoe built for racing — usually light, stiff, bouncy, less durable.' },
  { term: 'Stack', def: 'Total midsole thickness at a point. Heel stack + forefoot stack are the standard pair.' },
  { term: 'Super shoe', def: 'Informal name for a modern racer with a stiff plate and high-rebound foam. Typically high HER, high flexStiff, large forefoot flare.' },
  { term: 'TPU / eTPU', def: 'Thermoplastic polyurethane. Tough, bouncy foam used in midsoles like Adidas Boost.' },
  { term: 'TRAC', def: 'Traction score 0–1 on the owner’s test surface.', href: '/docs/metrics#trac' },
  { term: 'torsRigid', def: 'Twist rigidity — side-to-side torsional resistance. NOT the same as flexStiff.', href: '/docs/metrics#torsRigid' },
  { term: 'up-foam', def: 'Original sheet name for the forefoot flare metric (mFore − width).', href: '/docs/metrics#upFoam' },
  { term: 'val/M (valueIdx)', def: 'avg ER divided by price in millions of IDR. A composite shorthand for performance per rupiah, not a recommendation.', href: '/docs/metrics#valueIdx' },
  { term: 'Width', def: 'Upper width at the forefoot, in mm. Where your foot sits.', href: '/docs/metrics#width' },
];

export default function GlossaryPage() {
  const sorted = [...TERMS].sort((a, b) => a.term.localeCompare(b.term));
  return (
    <article className="max-w-3xl">
      <p className="text-xs text-muted mb-2">
        <Link href="/docs" className="hover:text-ink">
          ← Docs
        </Link>
      </p>
      <h1 className="text-2xl font-semibold mb-2">Glossary</h1>
      <p className="text-muted mb-6 text-sm">
        Every term and acronym used on this site, in plain English. Most link
        to their full entry in <Link href="/docs/metrics" className="text-accent">Metrics</Link>.
      </p>
      <dl className="space-y-3">
        {sorted.map((t) => (
          <div key={t.term} className="border-b border-line/60 pb-3">
            <dt className="text-ink font-medium">
              {t.href ? (
                <Link href={t.href} className="hover:text-accent">
                  {t.term}
                </Link>
              ) : (
                t.term
              )}
            </dt>
            <dd className="text-muted text-sm mt-1">{t.def}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

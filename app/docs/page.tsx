import Link from 'next/link';

export const metadata = { title: 'Docs · Soldex' };

const PAGES = [
  {
    href: '/docs/methodology',
    title: 'Methodology',
    blurb:
      'How the numbers were collected, what the test rig measures, and what to keep skeptical about.',
  },
  {
    href: '/docs/metrics',
    title: 'Metrics — every column explained',
    blurb:
      'Plain-English definition of every column in the browse table, including the ones friends keep mixing up (bend vs twist, durability vs bond, ER vs SA, flare).',
  },
  {
    href: '/docs/glossary',
    title: 'Glossary',
    blurb: 'Alphabetical list of every term and acronym used on this site.',
  },
  {
    href: '/docs/reading-the-data',
    title: 'Reading the data',
    blurb:
      'How to interpret the browse table, the compare radar, and the insights charts without over-reading the noise.',
  },
  {
    href: '/docs/faq',
    title: 'FAQ',
    blurb:
      'Common questions — "why is X missing a price?", "why no overall rating?", "is shoe Y good?", etc.',
  },
];

export default function DocsIndex() {
  return (
    <article className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Docs</h1>
        <p className="text-muted mt-1 text-sm">
          A friendly tour of what every number on this site actually means, and how the
          data was gathered. Written for runners, not engineers.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-3">
        {PAGES.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="block border border-line rounded p-4 hover:bg-panel transition"
          >
            <div className="text-ink font-medium">{p.title}</div>
            <p className="text-muted text-sm mt-1">{p.blurb}</p>
          </Link>
        ))}
      </div>

      <p className="text-xs text-muted pt-4">
        Soldex is a private data set and intentionally not a recommender. Numbers are
        directional, not definitive — see{' '}
        <Link href="/docs/methodology" className="text-accent hover:underline">
          methodology
        </Link>
        .
      </p>
    </article>
  );
}

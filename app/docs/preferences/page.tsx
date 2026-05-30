import Link from 'next/link';
import { CRITERIA, PROFILE_LABEL, type ProfileKey } from '@/lib/preferences';

export const metadata = { title: 'Profile fit · Soldex Docs' };

const PROFILES: ProfileKey[] = ['daily', 'max', 'super'];

const PROFILE_DESC: Record<ProfileKey, string> = {
  daily:
    'Everyday training shoe: flexible, firm, light, durable, smaller forefoot flare, cheap. Rocker and plate are not required.',
  max: 'Maximum-cushion daily / long-run shoe: rigid (stable for tall stack), firm foam, heavier OK, durable, larger flare, cheap. Rocker and plate are not required.',
  super:
    'Race/super-shoe: rigid plate underfoot, soft bouncy foam, light, durable, larger flare, rocker required, carbon plate accepted. Plate and rocker are now scored when known; shoes with unknown values just don\u2019t earn those points (lower coverage %).',
};

const DIR_WORD = (
  dir: 1 | -1 | boolean | null,
): string => {
  if (dir === 1) return 'higher';
  if (dir === -1) return 'lower';
  if (dir === true) return 'yes';
  if (dir === false) return 'no';
  return '—';
};

export default function PreferencesPage() {
  return (
    <article className="max-w-4xl prose prose-invert">
      <p className="text-xs text-muted">
        <Link href="/docs" className="hover:text-ink">
          ← Docs
        </Link>
      </p>
      <h1 className="text-2xl font-semibold">Profile fit (owner&apos;s preferences)</h1>
      <p className="text-muted">
        Three usage profiles — DAILY, MAX, SUPER — each with the owner&apos;s
        stated preferred direction on every measurable criterion. Every shoe
        gets a 0–100 score per profile, computed transparently from these
        rules. Soldex still isn&apos;t a recommender: this is just{' '}
        <em>the owner&apos;s own taste, made explicit and applied uniformly</em>.
        Your taste is probably different.
      </p>

      <h2 className="text-lg font-semibold mt-8">The profiles</h2>
      <div className="not-prose grid sm:grid-cols-3 gap-3 mt-2">
        {PROFILES.map((p) => (
          <div key={p} className="border border-line rounded p-3 bg-panel/40">
            <div className="text-ink font-medium">{PROFILE_LABEL[p]}</div>
            <p className="text-sm text-muted mt-1">{PROFILE_DESC[p]}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-10">The criteria matrix</h2>
      <p className="text-sm text-muted">
        Direction per profile: <em>higher</em> = bigger value scores better;{' '}
        <em>lower</em> = smaller value scores better.
      </p>
      <div className="overflow-x-auto not-prose">
        <table className="w-full text-sm border border-line">
          <thead className="bg-panel text-muted text-xs">
            <tr>
              <th className="text-left p-2 border-b border-line">Criterion</th>
              <th className="text-left p-2 border-b border-line">Field</th>
              <th className="text-center p-2 border-b border-line">DAILY</th>
              <th className="text-center p-2 border-b border-line">MAX</th>
              <th className="text-center p-2 border-b border-line">SUPER</th>
            </tr>
          </thead>
          <tbody>
            {CRITERIA.map((c) => (
              <tr key={c.field as string} className="border-b border-line/60">
                <td className="p-2 text-ink">{c.label}</td>
                <td className="p-2 font-mono text-xs text-muted">
                  <Link
                    href={`/docs/metrics#${c.field as string}`}
                    className="hover:text-accent"
                  >
                    {c.field as string}
                  </Link>
                </td>
                <td className="p-2 text-center">{DIR_WORD(c.daily)}</td>
                <td className="p-2 text-center">{DIR_WORD(c.max)}</td>
                <td className="p-2 text-center">{DIR_WORD(c.super)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold mt-10">How the score is computed</h2>
      <ol>
        <li>
          For every criterion, the population mean and standard deviation are
          computed across all 174 shoes.
        </li>
        <li>
          Each shoe&apos;s value is converted to a z-score (how many standard
          deviations from the mean).
        </li>
        <li>
          The z-score is multiplied by the profile&apos;s direction (+1 for
          higher-is-better, −1 for lower-is-better), then clipped to ±2 to
          prevent outliers from dominating.
        </li>
        <li>
          The result is rescaled to 0–1 (where 1 = strongly aligned with the
          preference, 0 = strongly against).
        </li>
        <li>
          The final score is the mean of all available per-criterion scores,
          multiplied by 100.
        </li>
      </ol>
      <p>
        Missing measurements are skipped — they don&apos;t penalize the shoe,
        they just shrink the sample. The detail card shows{' '}
        <em>coverage %</em> so you know how complete the data was.
      </p>

      <h2 className="text-lg font-semibold mt-10">Caveats</h2>
      <ul>
        <li>
          <strong>Rocker and plate are not measured.</strong> They are
          required pre-requisites in the SUPER profile and unacceptable in
          DAILY/MAX. Until those fields exist in the dataset, the SUPER score
          is best read as an <em>upper bound</em>: a shoe with a high SUPER
          score AND a known rocker + plate is interesting; a high SUPER score
          with no plate is misleading.
        </li>
        <li>
          <strong>Equal weighting.</strong> Every criterion is weighted
          equally inside a profile. That is a simplification — a real-world
          decision usually weights performance and price more than, say,
          traction. The matrix is easy to extend with weights when the owner
          has them.
        </li>
        <li>
          <strong>Population-relative.</strong> A score of 100 doesn&apos;t
          mean &quot;perfect shoe&quot;; it means &quot;maximally aligned with
          the profile within this dataset.&quot; Add more shoes and every
          score will shift slightly.
        </li>
        <li>
          <strong>It is one person&apos;s taste.</strong> If you disagree with
          any direction in the matrix (e.g. you want SOFT for daily, not
          firm), the score is wrong for you. Use the raw columns instead.
        </li>
      </ul>

      <p className="mt-8 text-xs text-muted">
        Source of truth: <code>lib/preferences.ts</code>.
      </p>
    </article>
  );
}

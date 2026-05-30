# Soldex

> **Sole Index** — a personal, data-first running-shoe database.
> Pure measured data. No reviews, no opinions, no recommender.

**Spec:** [docs/PROJECT.md](docs/PROJECT.md) · **License:** MIT

Current dataset: **174 shoes** across **18 brands** and **11 foam families**.
Filter, sort, compare, and explore the insights charts in a single client-side
app. Trusted users (invite-only) can sign in to add, edit, soft-delete, and
restore shoes, with every change recorded in an immutable revision log.

---

## Quick start

Requirements: **Node 20+**, `git`. (Python is only needed if you want to
re-run the legacy xlsx ETL.)

```bash
npm install
npm run dev   # http://localhost:3000
```

The app runs against bundled JSON in `public/data/` by default, so no
environment variables are required for development or read-only deploys.

### Connecting to Supabase (CRUD)

1. Provision the schema in your Supabase project — see
   [`supabase/README.md`](supabase/README.md) for the dashboard walk-through.
2. Copy `.env.local.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (only for `npm run migrate`)
3. Seed the database from the bundled JSON: `npm run migrate`.
4. Create user accounts in the Supabase Auth dashboard (emails follow the
   `<username>@soldex.local` convention).

When the public env vars are set the SWR hooks fetch from the `shoes_full`
view; otherwise they transparently fall back to the bundled JSON.

---

## Pages

| Route | What it does |
|---|---|
| `/` | Browse — filter sidebar + sortable table with inline band badges |
| `/shoe/[id]` | Detail — grouped fields, similar shoes, profile-fit scores, revisions |
| `/shoe/new`, `/shoe/[id]/edit` | Auth-gated forms generated from `COLUMN_META` |
| `/compare` | Up to 4 shoes side-by-side with radar chart and diff table |
| `/insights` | Seven charts: scatter, Pareto, bars, histograms |
| `/trash` | Auth-gated list of soft-deleted shoes with one-click restore |
| `/login` | Username + password (invite-only) |
| `/docs/*`, `/about` | Field reference, methodology, FAQ, glossary, preferences |

A floating "Compare (n)" pill is visible on every page once you've ticked at
least one shoe.

---

## Project layout

```
soldex/
├── app/                            ← App Router pages
├── components/                     ← BrowseView, ShoeDetail, ShoeForm, ...
├── lib/                            ← columns, types, bands, preferences, hooks, mutations, supabase
├── store/compare.ts                ← Zustand compare-cart (max 4, persisted)
├── styles/globals.css
├── public/data/                    ← shoes.json + meta.json (bundled fallback)
├── supabase/migrations/            ← SQL schema (0001_init.sql)
├── supabase/README.md              ← dashboard setup walk-through
├── scripts/migrate_to_supabase.ts  ← idempotent JSON → DB importer
├── legacy/                         ← xlsx source + Python ETL (kept for reference)
│   ├── data/EnergyReturn-ShockAbsorption.xlsx
│   ├── scripts/build_data.py
│   └── requirements.txt
├── docs/PROJECT.md                 ← living spec
├── .env.local.example
├── package.json · package-lock.json
├── next.config.mjs · tsconfig.json · tailwind.config.js · postcss.config.mjs
├── LICENSE                         ← MIT
└── README.md
```

## Scripts

| Command            | What it does                                            |
|--------------------|---------------------------------------------------------|
| `npm run dev`      | Next dev server with HMR                                |
| `npm run build`    | Production build for Vercel / Node hosts                |
| `npm run start`    | Serve the production build                              |
| `npm run lint`     | ESLint via `next lint`                                  |
| `npm run format`   | Prettier write                                          |
| `npm run migrate`  | Seed Supabase from `public/data/shoes.json`             |
| `npm run data`     | Legacy: re-run Python ETL (`legacy/scripts/build_data.py`) |

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS 3** — utility-first, plain config, dark theme
- **Recharts** for radar / scatter / bar charts
- **Zustand** (persisted to `localStorage`) for the compare-cart
- **SWR** for data fetching with stale-while-revalidate
- **Supabase** (Postgres + Auth + RLS) for the CRUD backend
- Optional **Python 3.10+** with **pandas** + **openpyxl** for the legacy ETL

See [docs/PROJECT.md §5](docs/PROJECT.md#5-tech-stack) for what was specified
vs. shipped vs. deferred.

## Notes

- The bundled dataset (~50 KB JSON) keeps the site fully functional with no
  Supabase credentials. Once Supabase env vars are set, the same hooks switch
  over automatically.
- `noindex,nofollow` is set in `app/layout.tsx` — not intended for
  search-engine discovery.
- Soft deletes (`deleted_at`) keep history; every insert/update/delete writes
  an immutable row to `shoe_revisions` via a security-definer trigger.
- The compare cart is persisted in `localStorage` *and* reflected in `?ids=`
  for sharing.

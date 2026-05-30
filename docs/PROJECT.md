# Soldex

> **Soldex — Sole Index.** A personal, data-first running-shoe database for me and a few friends.

**Status:** v0.1 shipped; mid-migration to Vercel + Supabase (CRUD, auth, revisions)
**Last updated:** 2026-05-30
**Owner:** muhbrohim ([github.com/muhbrohim/soldex](https://github.com/muhbrohim/soldex))
**Audience:** Personal use + a small circle of friends (unlisted URL)
**License:** MIT

---

## 0. What changed since v0.1

The original v0.1 was a fully static GitHub Pages site driven by a Python ETL
over an xlsx. The current main branch has migrated the architecture:

- **Hosting:** Vercel (Hobby), no static export.
- **Backend:** Supabase (Postgres + Auth + RLS) is the new source of truth.
  The bundled `public/data/*.json` is retained as a read-only fallback when
  Supabase env vars are absent (keeps the site functional in CI and pre-prod).
- **CRUD:** Trusted users (`esa`, `ibrathiel`) can sign in to add, edit,
  soft-delete, and restore shoes via dashboard-provisioned accounts. Every
  write produces an immutable row in `shoe_revisions` via a security-definer
  trigger.
- **Schema:** Adds `has_plate` / `has_rocker` (tri-state) and `categories`
  (was: sheet membership). Soft delete via `deleted_at`.
- **Bands:** Tertile thresholds replace fixed thresholds; computed from the
  full population so labels stay stable under filtering.
- **Preferences:** `has_plate` / `has_rocker` are now scored for the SUPER
  profile (unknown = skipped, not penalized).
- **Legacy:** xlsx + Python ETL moved to `legacy/` (kept for reference and
  one-off regeneration of the bundled JSON).

The rest of this document still describes the v0.1 spec as originally shipped;
treat anything below that references GitHub Pages, static export, or build-time
data as historical context.

---

## 1. What this is

Soldex is a small, public-but-unlisted web app that started life as a
filterable browser over a hand-curated spreadsheet of running-shoe
measurements. The dataset now lives in Postgres; the spreadsheet is archived
in `legacy/data/`.

It is not a review site. It is not a recommender. It presents pure measured
data and lets the viewer slice it however they want.

### Why it exists

- The source spreadsheet has 13 sheets and 150+ shoe entries — too dense to read directly
- Friends keep asking "which one should I get?" — easier to share a filterable URL than re-explain the spreadsheet
- The xlsx will keep growing; a static doc rots, a small app stays useful

### Non-goals

- No reviews, opinions, or affiliate links
- No user accounts, comments, or social features
- No backend, no database, no live scraping
- Not optimized for SEO or public discovery — by design

---

## 2. Audience & access model

| Audience | Access |
|---|---|
| Owner | Full read; data refresh via local script + `git push` |
| Close friends | Read-only via shared, unlisted URL |
| Public / search engines | Not intended; no link from public pages, `noindex,nofollow` meta tag |

Security model: **obscurity, not authentication.** Acceptable for non-sensitive
personal data. The repo is public (so GitHub Pages works on a free account)
but the dataset is observational and contains no PII. A shared-passphrase
splash is an optional later add-on.

---

## 3. Data source

- **Source of truth:** `data/EnergyReturn-ShockAbsorption.xlsx`
- **Sheets (13):** INTERESTED, MEGABLAST, DAILY, MAXIMALIST, SUPER, TOP5TRAINER, HYPED, RACERS, HOKA, PUMA, 60>HER>55, 70>HER>60, HER>70
- **Current dataset:** **174 unique shoes** across **18 brands** and **11 foam families**
- **Update cadence:** ad-hoc, manual (when owner adds new shoes)

### Field dictionary

| Field | Type | Meaning |
|---|---|---|
| HER | float | Heel Energy Return (%) |
| FER | float | Forefoot Energy Return (%) |
| HSA | int | Heel Shock Absorption |
| FSA | int | Forefoot Shock Absorption |
| W | int | Weight, US M9, grams |
| Pr | int | Price in IDR (Indonesian Rupiah) |
| Heel / Fore | float | Stack heights in mm |
| DROP | float | Heel-to-toe drop in mm |
| Width / Toe | float | Last and toebox geometry |
| m-fore | float | Midfoot/forefoot measurement |
| o-thick / drem | float | Outsole thickness, remaining wear depth |
| o-dur% / o-stay | float | Outsole durability %, stay-on-foam score |
| TRAC | float (0–1) | Traction score |
| m-soft | float | Midsole softness |
| flexstiff / torsrigid | float | Longitudinal & torsional stiffness |
| FOAM | enum | A-TPU, A-TPU/EVA, A-TPU/TPEE, EVA, PEBA, PEBA/EVA, POE, TPE, TPEE, TPU, eTPU |
| up-foam | float | Upper-foam metric |
| myApprox | int | Owner's weight estimate |
| Type | enum | R (race), D (daily), DC (daily-cushion), C (cushion), S (speed), M (maximalist), RET (retired race) |
| minus / re-BUY / conclusion | text | Owner's qualitative notes |

### Derived fields (computed in ETL)

| Field | Formula |
|---|---|
| `avgEr` | `(HER + FER) / 2` |
| `avgSa` | `(HSA + FSA) / 2` |
| `herMinusFer` | `HER - FER` |
| `valueIdx` | `avgEr / (Pr / 1_000_000)` (energy return per million IDR) |

---

## 4. Architecture

```
┌──────────────────────────────────────────┐
│  data/EnergyReturn-ShockAbsorption.xlsx  │  ← source of truth (committed)
└────────────────┬─────────────────────────┘
                 │ python scripts/build_data.py   (locally OR in CI)
                 ▼
┌──────────────────────────────────────────┐
│  public/data/shoes.json                  │  ← canonical, deduped, typed
│  public/data/meta.json                   │  ← brands, foams, ranges, generatedAt
└────────────────┬─────────────────────────┘
                 │ next build  (output: 'export' → ./out)
                 ▼
┌──────────────────────────────────────────┐
│  Plain static site (HTML + JS + JSON)    │
│  No runtime backend, no API routes       │
└────────────────┬─────────────────────────┘
                 │ GitHub Actions
                 ▼
┌──────────────────────────────────────────┐
│  GitHub Pages                            │
│  https://muhbrohim.github.io/soldex/     │
└────────────────┬─────────────────────────┘
                 │ shareable URL
                 ▼
            Owner + friends
```

- **Build-time only.** No server runtime, no API routes.
- **Data is bundled** into the static build; the entire dataset (~50 KB JSON) loads on first paint.
- **All filtering, sorting, and comparison happens in the browser** — instant, no network round trips.

---

## 5. Tech stack

Three columns: what the v0 spec called for · what actually ships in v0.1 ·
why if different.

### Front-end

| Layer | Specified | Shipped | Notes |
|---|---|---|---|
| Framework | Next.js 15 (App Router) | **Next.js 15.1.6** | unchanged |
| Language | TypeScript 5 | **TypeScript 5.7** | unchanged |
| Runtime | React 19 | **React 19** | unchanged |
| Styling | Tailwind CSS 4 | **Tailwind CSS 3.4** | 3.x is stable; 4.x had churning APIs at scaffold time |
| UI primitives | shadcn/ui | hand-rolled Tailwind | deferred — same accessibility patterns, no CLI dependency, easier to swap in later |
| Tables | TanStack Table 8 | hand-rolled `<table>` | dataset is <200 rows; HOC sort works fine |
| Charts | Recharts 2 | **Recharts 2.15** | unchanged |
| Filter state | nuqs | local React state | deferred — easy follow-up to gain shareable filter URLs |
| Local state | Zustand | **Zustand 5** (persist middleware) | bumped from 4 to 5 |
| Icons | Lucide | none | none needed for v0.1 UI |
| Formatting | `Intl.NumberFormat('id-ID')` | custom `formatIdr` returning `Rp 2,3 jt` | small wrapper for compact display |

### ETL (data pipeline)

| Layer | Choice |
|---|---|
| Language | **Python 3.10+** (CI uses 3.12) |
| Excel reader | **openpyxl** + **pandas** (pinned in `requirements.txt`) |
| Output | Plain JSON, committed to `public/data/` |
| Validation | Console quality report (per-sheet counts, missing fields) |

### Tooling & ops

| Concern | Choice |
|---|---|
| Package manager | **npm** (lockfile committed) |
| Linter | **ESLint** via `next lint` (`next/core-web-vitals`) |
| Formatter | **Prettier** (`.prettierrc` at repo root) |
| Editor consistency | `.editorconfig` |
| Node pin | `.nvmrc` = `20` (CI pins inline) |
| VCS | **Git**, public repo on GitHub |
| Hosting | **GitHub Pages** (free, no card, public-repo friendly) |
| CI/CD | **GitHub Actions** — `.github/workflows/deploy.yml` runs on push to `main` |
| URL | `https://muhbrohim.github.io/soldex/` (base path set automatically from repo name) |
| Analytics | None |
| Error tracking | None |

### Explicitly NOT used (and why)

| Tech | Why not |
|---|---|
| Database (Postgres / SQLite / Supabase) | Dataset is tiny and static; JSON is faster |
| Auth (NextAuth, Clerk) | Friends-only; obscurity is enough for v0 |
| API layer / tRPC | No runtime data; everything is build-time |
| CMS (Sanity, Contentful) | The xlsx *is* the CMS |
| Docker | The host handles the runtime; nothing to containerize |
| Storybook | Component count is small |
| Tests (Jest, Playwright) | Deferred to post-v1 if app stabilizes |

---

## 6. Project layout

> The original spec sketched a nested `script/shoe-app/` layout. That was
> flattened to the repo root before first commit — idiomatic for a single-app
> repo and removes the need for "Root Directory" overrides on every host.

```
soldex/                                     ← repo root = the Next.js app
├── app/                                    ← App Router pages
│   ├── layout.tsx
│   ├── page.tsx                            ← / (browse)
│   ├── compare/page.tsx                    ← /compare?ids=a,b,c,d
│   ├── shoe/[id]/page.tsx                  ← /shoe/:id (detail)
│   ├── insights/page.tsx                   ← /insights (charts)
│   └── about/page.tsx                      ← /about (legend, disclaimer)
├── components/
│   ├── BrowseView.tsx                      ← sidebar filters + sortable table
│   ├── ShoeDetail.tsx                      ← grouped stats + similar/same-brand/same-foam lists
│   ├── ComparePage.tsx                     ← radar + diff table + share link
│   ├── InsightsView.tsx                    ← all 6 charts
│   └── CompareBar.tsx                      ← floating "Compare (n)" pill
├── lib/
│   ├── types.ts                            ← Shoe, Meta, Filters
│   ├── data.ts                             ← typed import of shoes.json/meta.json
│   ├── filter.ts                           ← pure filter + sort fns
│   ├── derive.ts                           ← similar() + TYPE_LABEL map
│   └── format.ts                           ← formatIdr, formatGrams, formatPct, formatMm
├── store/
│   └── compare.ts                          ← Zustand store, persisted, MAX_COMPARE=4
├── styles/globals.css                      ← Tailwind + small dark-theme overrides
├── public/data/
│   ├── shoes.json                          ← generated, committed
│   └── meta.json                           ← generated, committed
├── data/
│   ├── EnergyReturn-ShockAbsorption.xlsx   ← source of truth
│   └── EnergyReturn-ShockAbsorption.md     ← human-readable conversion (auto)
├── scripts/
│   └── build_data.py                       ← ETL: xlsx → public/data/*.json
├── docs/
│   └── PROJECT.md                          ← this document
├── .github/workflows/deploy.yml            ← GH Pages CI
├── package.json · package-lock.json
├── tsconfig.json
├── next.config.mjs                         ← output: 'export', base path from env
├── tailwind.config.js · postcss.config.mjs
├── requirements.txt                        ← Python ETL deps
├── .nvmrc · .editorconfig · .eslintrc.json · .prettierrc · .gitattributes
├── .gitignore
├── LICENSE                                 ← MIT
└── README.md                               ← dev / data-update / deploy
```

---

## 7. Pages & UX (as shipped)

### `/` — Browse

- Left filter sidebar (sticky on desktop, stacks on mobile)
- Filters: free-text search · brand · type · foam · sheet · max price · max weight · min HER · min FER · min/max drop
- Table: 14 columns, sortable by any numeric or text column, sticky header, "+ compare" checkbox per row
- Header line shows `N of TOTAL shoes · data <date> · compare n/4`
- Reset-filters button

### `/compare?ids=a,b,c,d`

- Up to 4 shoes side-by-side
- Header cards: brand, version, price, weight, drop, color-keyed swatch
- Radar chart: HER, FER, HSA, FSA, TRAC, m-soft (each normalized to a sensible axis max)
- Diff table: 15 numeric fields; best value per row highlighted in accent color (direction-aware — lower price wins, higher HER wins)
- Owner notes per shoe (`minus · conclusion · re-buy`)
- Copy-share-link button (writes `?ids=` URL to clipboard)
- URL `?ids=` overrides and syncs into the Zustand store on load

### `/shoe/[id]`

- Grouped stat tiles: Performance · Geometry · Midsole/Outsole · Price
- Owner notes block when present
- "Similar shoes" — top 5 by Euclidean distance over z-scored HER/FER/weight/drop/heel
- "More from this brand" and "Same foam" lists (top 6 each)
- Add/remove from compare directly from the detail page
- Back link to browse

### `/insights`

Pure-data charts, no commentary, all rendered with Recharts:

1. Scatter — HER vs Price (color = brand)
2. Scatter — HER vs Weight (Pareto frontier highlighted)
3. Bar — avg HER by foam type (with sample size)
4. Bar — avg HER by brand (with sample size)
5. Histogram — drop distribution
6. Histogram — price distribution (M IDR bins)

### `/about`

- Field legend (the dictionary from §3)
- Data-source note + last-updated date pulled from `meta.generatedAt`
- Disclaimer: measurements are personal, methodology is informal

---

## 8. Data pipeline (ETL)

`scripts/build_data.py` responsibilities:

1. Load all 13 sheets via `pandas.ExcelFile(..., engine="openpyxl")`
2. Walk row-by-row; treat any row containing `Brand` + `Version` + at least one of HER/HSA/FER/FSA as an active schema
3. Use that schema for subsequent rows until another header / blank / `average` row
4. Skip junk: fully blank rows, `average`-named summary rows
5. Coerce types: round floats to 2 dp, `Pr` → int, `4out5`-style strings → fractional float
6. Slug ID = `slugify(brand + " " + version)`
7. Dedupe by ID; merge `categories[]` from sheet provenance; keep the richer record
8. Compute derived fields (`avgEr`, `avgSa`, `herMinusFer`, `valueIdx`)
9. Emit `public/data/shoes.json` and `public/data/meta.json`
10. Print a quality report: per-sheet rows kept, total raw rows, unique shoes, missing HER/FER, missing price

### `meta.json` shape (live values)

```json
{
  "generatedAt": "2026-05-30",
  "shoeCount": 174,
  "brands": ["Adidas", "Altra", "Asics", "Brooks", "Hoka", "Mizuno", "NB", "Nike", "ON", "On", "Ortuseight", "Puma", "Reebok", "Salomon", "Saucony", "Skechers", "Topo", "Under Armour"],
  "foams": ["A-TPU", "A-TPU/EVA", "A-TPU/TPEE", "EVA", "PEBA", "PEBA/EVA", "POE", "TPE", "TPEE", "TPU", "eTPU"],
  "types": ["C", "D", "DC", "M", "R", "RET", "S"],
  "categories": ["INTERESTED", "MEGABLAST", "DAILY", "MAXIMALIST", "SUPER", "TOP5TRAINER", "HYPED", "RACERS", "HOKA", "PUMA", "60>HER>55", "70>HER>60", "HER>70"],
  "ranges": {
    "her": [44.2, 80.6],
    "fer": [45.9, 82.6],
    "weightG": [99, 335],
    "priceIdr": [2000000, 11000000],
    "drop": [3.2, 14.0]
  }
}
```

> Known data-quality items to clean up later: `ON` and `On` both appear as
> distinct brands (case mismatch in the source); 113/174 shoes are missing
> a price; some sheets (TOP5TRAINER, HOKA, PUMA) use a layout the ETL
> currently can't parse and contribute 0 rows.

---

## 9. Update workflow

```
edit data/EnergyReturn-ShockAbsorption.xlsx
  → npm run data
  → review the console quality report
  → git add -A && git commit -m "data: refresh YYYY-MM-DD"
  → git push
  → GitHub Actions auto-deploys (~2 min)
  → friends see updated data on next page load
```

End-to-end: about 2 minutes when nothing has broken.

---

## 10. Roadmap

### v0.1 — Foundations ✅ SHIPPED
- [x] ETL script + canonical JSON
- [x] Next.js scaffold + Tailwind + dark theme
- [x] Static `/about` page
- [x] Deployed to GitHub Pages under unlisted URL

### v0.2 — Browse ✅ SHIPPED
- [x] Filter sidebar (all filters listed in §7)
- [x] Sortable table + per-row compare checkbox
- [ ] URL-encoded filter state (deferred — currently local state only)
- [ ] Detail drawer (replaced with full `/shoe/[id]` page)

### v0.3 — Compare ✅ SHIPPED
- [x] Compare cart (Zustand, persisted, max 4)
- [x] `/compare` page with radar + diff table
- [x] Share-link button (`?ids=` query)

### v0.4 — Insights ✅ SHIPPED
- [x] All 6 charts on `/insights`

### v0.5 — Polish (in progress)
- [x] Dark mode (default; only mode)
- [x] IDR formatting (`Rp 3,2 jt`)
- [ ] Mobile layout pass (basic responsiveness works; needs touch tweaks)
- [ ] Empty states, loading skeletons

### Post-v1 backlog
- Shared-passphrase splash gate
- "Saved views" via `localStorage`
- Export filtered table to CSV
- Per-shoe photo (manual upload to `/public/img/`)
- i18n (EN ↔ ID)
- Swap in **shadcn/ui** primitives if/when complexity warrants it
- Swap in **nuqs** for URL-state filter sharing
- Add **TanStack Table** when row count justifies virtualization
- Clean up data dupes (`ON` vs `On`); extend ETL to cover TOP5TRAINER/HOKA/PUMA layouts

---

## 11. Decisions (locked at v0.1)

| # | Question | Decision |
|---|---|---|
| 1 | Project name | **Soldex** (Sole Index) |
| 2 | Repo location | `github.com/muhbrohim/soldex` (flat, app at repo root) |
| 3 | GitHub visibility | **Public** (required for free GitHub Pages) — data has no PII |
| 4 | License | **MIT** |
| 5 | UI language | English only for v1 |
| 6 | Compare slot count | 4 |
| 7 | Insights charts | All 6 |
| 8 | Dark mode + mobile polish | v0.5 (within v1) |
| 9 | Host | **GitHub Pages** — `https://muhbrohim.github.io/soldex/` (custom domain optional later) |
| 10 | Package manager | **npm** (lockfile committed) |
| 11 | Generated JSON | Committed under `public/data/` — hosts without Python can still deploy |

---

## 12. Risks & assumptions

| Risk | Mitigation |
|---|---|
| Source xlsx schema drifts (new columns, renamed sheets) | ETL prints a clear report; new fields default to null in JSON; UI tolerates missing fields |
| Mid-table header rows in `INTERESTED` confuse the parser | Header detection is row-pattern-based, not row-index-based |
| Inconsistent `torsRigid` / `re-BUY` values | Coerce-or-null in ETL; UI treats as optional |
| Brand/foam typos cause duplicate filter chips | Manual cleanup in xlsx; could add a normalization map in ETL later |
| Friends accidentally share URL publicly | No PII in data; can add passphrase gate later |
| Dataset grows beyond ~1000 shoes | JSON still fine up to ~5 MB; switch to chunked loading only if needed |
| `npm install` lockfile drift between OSes | CI uses `npm install` (not `npm ci`) to side-step Windows↔Linux SWC binary mismatch |
| GitHub Pages limits | Soft 1 GB / 100 GB-month — orders of magnitude beyond friend-circle usage |

### Assumptions

- Owner is comfortable running a Python script and `git push` for data refreshes
- 150–500 shoes is the realistic ceiling for this dataset
- No legal concerns publishing measurements (data is personal / observational)
- Friend group is < 50 people

---

## 13. Glossary

- **HER / FER** — Heel / Forefoot Energy Return; higher = more bouncy
- **HSA / FSA** — Heel / Forefoot Shock Absorption; higher = more cushioned
- **DROP** — heel stack minus forefoot stack, in mm
- **PEBA, A-TPU, EVA, TPEE, POE, TPE, TPU, eTPU** — midsole foam chemistries
- **Type R / D / DC / C / S / M / RET** — Race, Daily, Daily-Cushion, Cushion, Speed, Maximalist, Retired-race
- **Pr** — Price in Indonesian Rupiah
- **valueIdx** — `avgEr / (price / 1,000,000)` — higher means more energy return per million IDR

---

*This is a living document. Edit freely as the project evolves.*

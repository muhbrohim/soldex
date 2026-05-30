# Soldex

> **Soldex — Sole Index.** A personal, data-first running-shoe database for me and a few friends.

**Status:** Planning · v0
**Last updated:** 2026-05-30
**Owner:** w200221
**Audience:** Personal use + a small circle of friends (unlisted URL)

---

## 1. What this is

Soldex is a small, private web app that turns a hand-curated spreadsheet of running-shoe measurements (`EnergyReturn-ShockAbsorption.xlsx`) into a fast, filterable, comparable browsing experience.

It is not a review site. It is not a recommender. It presents pure measured data and lets the viewer slice it however they want.

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
| Owner | Full read; data refresh via local script + redeploy |
| Close friends | Read-only via shared, unlisted URL |
| Public / search engines | Not intended; no link from public pages, `noindex` meta tag |

Security model: **obscurity, not authentication.** Acceptable for non-sensitive personal data. A shared-passphrase splash is an optional later add-on.

---

## 3. Data source

- **Source of truth:** `EnergyReturn-ShockAbsorption.xlsx` (kept locally)
- **Sheets:** INTERESTED, MEGABLAST, DAILY, MAXIMALIST, SUPER, TOP5TRAINER, HYPED, RACERS, HOKA, PUMA, 60>HER>55, 70>HER>60, HER>70
- **Row count:** ~150 unique shoes across 14 brands
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
| FOAM | enum | PEBA, A-TPU, EVA, TPEE, POE, A-TPU/EVA, A-TPU/TPEE, PEBA/EVA, TPE |
| up-foam | float | Upper-foam metric |
| myApprox | int | Owner's weight estimate |
| Type | enum | R (race) / D (daily) / DC (daily-cushion) / C (cushion) / S (speed) |
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
┌──────────────────────────────┐
│  EnergyReturn-Shock... .xlsx │  ← source of truth (local)
└──────────────┬───────────────┘
               │ python scripts/build_data.py
               ▼
┌──────────────────────────────┐
│  public/data/shoes.json      │  ← canonical, deduped, typed
│  public/data/meta.json       │  ← brand list, foam list, counts, generatedAt
└──────────────┬───────────────┘
               │ next build (SSG)
               ▼
┌──────────────────────────────┐
│  Next.js static site          │  ← deployed to Vercel
│  (no runtime backend)         │
└──────────────┬───────────────┘
               │ shareable URL
               ▼
        Owner + friends
```

- **Build-time only.** No server runtime, no API routes.
- **Data is bundled** into the static build; the entire dataset (~50 KB JSON) loads on first paint.
- **All filtering, sorting, and comparison happens in the browser** — instant, no network round trips.

---

## 5. Tech stack

### Front-end

| Layer | Choice | Version | Reason |
|---|---|---|---|
| Framework | **Next.js (App Router)** | 15.x | SSG by default, file-system routing, first-class Vercel deploy |
| Language | **TypeScript** | 5.x | Type safety against the JSON schema |
| Runtime | React | 19.x | Bundled with Next 15 |
| Styling | **Tailwind CSS** | 4.x | Utility-first, no theme bikeshedding |
| UI primitives | **shadcn/ui** | latest | Accessible, copy-in components (Button, Drawer, Slider, Table, Dialog) |
| Tables | **TanStack Table** | 8.x | Headless sort/filter/column-visibility |
| Charts | **Recharts** | 2.x | Radar (compare), Scatter (insights), Bar (insights) |
| Filter state | **nuqs** | latest | Filters stored in URL → shareable links |
| Local state | **Zustand** | 4.x | Compare-cart and UI ephemeral state |
| Icons | **Lucide** | latest | Bundled with shadcn/ui |
| Formatting | `Intl.NumberFormat('id-ID')` | native | IDR currency formatting |

### ETL (data pipeline)

| Layer | Choice | Reason |
|---|---|---|
| Language | **Python 3.12+** | Already installed; pandas familiarity |
| Excel reader | **openpyxl** + **pandas** | Already installed |
| Output | **Plain JSON** | No DB; direct app consumption |
| Validation | Manual asserts + console report | 150 rows; pydantic is overkill |

### Tooling & ops

| Concern | Choice |
|---|---|
| Package manager | **pnpm** (preferred) or npm |
| Linter / formatter | **ESLint** + **Prettier** (Next.js defaults) |
| Type checker | **tsc --noEmit** in CI |
| VCS | **Git** |
| Remote | **GitHub** (private repo) |
| Hosting | **Vercel** (Hobby/free tier) |
| CI/CD | Vercel auto-deploy on `git push` to `main` |
| Domain | Vercel subdomain (e.g. `soldex.vercel.app`) — custom domain optional |
| Analytics | None initially; **Vercel Analytics** (free tier) optional later |
| Error tracking | None initially |

### Explicitly NOT used (and why)

| Tech | Why not |
|---|---|
| Database (Postgres / SQLite / Supabase) | Dataset is tiny and static; JSON is faster |
| Auth (NextAuth, Clerk) | Friends-only; obscurity is enough for v0 |
| API layer / tRPC | No runtime data; everything is build-time |
| State manager beyond Zustand | Overkill for a CRUD-less browse app |
| CMS (Sanity, Contentful) | The xlsx *is* the CMS |
| Docker | Vercel handles the runtime; nothing to containerize |
| Storybook | Component count is small |
| Tests (Jest, Playwright) | Deferred to post-v1 if app stabilizes |

---

## 6. Project layout

> Note: layout was flattened from the original `script/shoe-app/` sketch.
> The Next.js app is now the repo root, which is idiomatic for a single-app
> repo and avoids "Root Directory" overrides on every host.

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
│   ├── BrowseView.tsx
│   ├── ShoeDetail.tsx
│   ├── ComparePage.tsx
│   ├── InsightsView.tsx
│   └── CompareBar.tsx                      ← floating "Compare (n)" pill
├── lib/
│   ├── types.ts                            ← Shoe, Meta, Filters
│   ├── data.ts                             ← typed import of shoes.json
│   ├── filter.ts                           ← pure filter/sort fns
│   ├── derive.ts                           ← derived-field helpers
│   └── format.ts                           ← formatIdr, formatGrams, formatPct
├── store/
│   └── compare.ts                          ← Zustand store (max 4 ids)
├── styles/globals.css
├── public/data/
│   ├── shoes.json                          ← generated, committed
│   └── meta.json
├── data/
│   ├── EnergyReturn-ShockAbsorption.xlsx   ← source of truth
│   └── EnergyReturn-ShockAbsorption.md     ← human-readable conversion
├── scripts/
│   └── build_data.py                       ← ETL: xlsx → public/data/*.json
├── docs/
│   └── PROJECT.md                          ← this document
├── .github/workflows/deploy.yml            ← GH Pages CI
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.js
├── postcss.config.mjs
├── requirements.txt                        ← Python ETL deps
├── .nvmrc · .editorconfig · .eslintrc.json · .prettierrc
├── .gitignore
├── LICENSE
└── README.md                               ← dev / data-update / deploy
```

---

## 7. Pages & UX

### `/` — Browse

- **Layout:** left filter sidebar (collapsible on mobile), main result table
- **Filters:** brand multi, type, foam, price range (IDR), weight range, HER min, FER min, drop range, category sheets toggle, free-text search
- **Table:** sortable columns, sticky header, column-visibility picker, "Add to compare" checkbox per row
- **Top bar:** result count, reset filters, floating "Compare (n)" button
- **URL state:** every filter and sort encoded in `?` query string

### `/compare?ids=a,b,c,d`

- Up to 4 shoes side-by-side
- Header strip: brand, version, price, weight
- Radar chart: HER, FER, HSA, FSA, TRAC, m-soft (normalized 0–1)
- Bar charts: stack heights, durability
- Diff table: every numeric field; best value per row highlighted
- Owner notes per shoe (raw text)
- Copy-share-link button

### `/shoe/[id]`

- All fields grouped: Performance · Geometry · Outsole · Midsole · Notes
- "Similar shoes" — top 5 by Euclidean distance on (HER, FER, weight, drop, stack)
- "Same brand" and "Same foam" lists
- Back button preserves prior filter state

### `/insights`

Pure-data charts, no commentary:

1. Scatter — HER vs Price (color = brand)
2. Scatter — HER vs Weight (Pareto frontier highlighted)
3. Bar — avg HER by foam type (with sample size)
4. Bar — avg HER by brand (with sample size)
5. Histogram — drop distribution
6. Histogram — price distribution

### `/about`

- Field legend (the dictionary from §3)
- Data-source note + last-updated date
- Disclaimer: measurements are personal, methodology is informal

---

## 8. Data pipeline (ETL)

`scripts/build_data.py` responsibilities:

1. Load all 13 sheets via `pandas.ExcelFile(..., engine="openpyxl")`
2. Detect header rows dynamically (first row matching `Type|Brand|Version` or `No|Brand|Version`)
3. Skip junk rows: `average`, fully blank, summary totals
4. Coerce types: round floats to 2 dp, `Pr` → int, `torsRigid` strings (`4out5`) → null or normalized 0–1
5. Slug ID = `slugify(brand + " " + version)`
6. Dedupe by ID; merge `categories[]` from sheet provenance, take richest record
7. Compute derived fields (`avgEr`, `avgSa`, `herMinusFer`, `valueIdx`)
8. Emit `public/data/shoes.json` and `public/data/meta.json`
9. Print a quality report: rows in vs rows kept, dropped rows reasoned, shoes missing critical fields

### `meta.json` shape

```json
{
  "generatedAt": "2026-05-30",
  "shoeCount": 152,
  "brands": ["Adidas", "Asics", "Brooks", "..."],
  "foams": ["A-TPU", "EVA", "PEBA", "..."],
  "types": ["R", "D", "DC", "C", "S"],
  "categories": ["INTERESTED", "RACERS", "DAILY", "..."],
  "ranges": {
    "her": [44.2, 80.6],
    "fer": [45.9, 82.6],
    "weightG": [99, 335],
    "priceIdr": [2000000, 11000000],
    "drop": [5.2, 14.0]
  }
}
```

---

## 9. Update workflow

```
edit xlsx
  → python shoe-app/scripts/build_data.py
  → review console quality report
  → git add -A && git commit -m "data: refresh YYYY-MM-DD"
  → git push
  → Vercel auto-deploys (~30–60s)
  → friends see updated data on next page load
```

End-to-end: about 1 minute when nothing has broken.

---

## 10. Roadmap

### v0.1 — Foundations
- ETL script + canonical JSON
- Next.js scaffold + Tailwind + shadcn/ui
- Static `/about` page
- Deployed to Vercel under unlisted URL

### v0.2 — Browse
- Filter sidebar (all filters listed in §7)
- Sortable table + detail drawer
- URL-encoded filter state

### v0.3 — Compare
- Compare cart (Zustand)
- `/compare` page with radar + diff table
- Share-link button

### v0.4 — Insights
- All 6 charts on `/insights`

### v0.5 — Polish
- Mobile layout pass
- Empty states, loading skeletons
- IDR formatting (`Rp 3,2jt`)
- Dark mode (optional)

### Post-v1 backlog
- Shared-passphrase splash gate
- Vercel Analytics
- "Saved views" via localStorage
- Export filtered table to CSV
- Per-shoe photo (manual upload to `/public/img/`)
- i18n (EN ↔ ID)

---

## 11. Decisions locked for v1

| # | Question | Decision |
|---|---|---|
| 1 | Project name | **Soldex** (Sole Index) |
| 2 | Repo location | `script/shoe-app/` |
| 3 | GitHub | Private repo (confirm at deploy time) |
| 4 | UI language | English only for v1 |
| 5 | Compare slot count | 4 |
| 6 | Insights charts | All 6 |
| 7 | Dark mode + mobile polish | v0.5 (within v1) |
| 8 | Domain | `soldex.vercel.app` subdomain; custom domain optional later |

---

## 12. Risks & assumptions

| Risk | Mitigation |
|---|---|
| Source xlsx schema drifts (new columns, renamed sheets) | ETL prints a clear report; new fields default to null in JSON; UI tolerates missing fields |
| Mid-table header rows in `INTERESTED` confuse the parser | Header detection is row-pattern-based, not row-index-based |
| Inconsistent torsRigid / re-BUY values | Coerce or null in ETL; UI treats as optional |
| Friends accidentally share URL publicly | No PII in data; can add passphrase gate later |
| Dataset grows beyond ~1000 shoes | JSON still fine up to ~5MB; switch to chunked loading only if needed |
| Vercel free-tier limits | 100 GB/month bandwidth — far beyond friend-circle usage |

### Assumptions

- Owner is comfortable running a Python script and `git push` for data refreshes
- 150–500 shoes is the realistic ceiling for this dataset
- No legal concerns publishing measurements (data is personal/observational)
- Friend group is < 50 people

---

## 13. Glossary

- **HER / FER** — Heel / Forefoot Energy Return; higher = more bouncy
- **HSA / FSA** — Heel / Forefoot Shock Absorption; higher = more cushioned
- **DROP** — heel stack minus forefoot stack, in mm
- **PEBA, A-TPU, EVA, TPEE, POE, TPE** — midsole foam chemistries
- **Type R / D / DC / C / S** — Race, Daily, Daily-Cushion, Cushion, Speed
- **Pr** — Price in Indonesian Rupiah

---

*This is a living document. Edit freely as decisions get made.*

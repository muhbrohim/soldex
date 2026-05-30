# Soldex

> **Sole Index** — a personal, data-first running-shoe database.
> Pure measured data. No reviews, no opinions, no recommender.

**Live:** https://muhbrohim.github.io/soldex/
**Spec:** [docs/PROJECT.md](docs/PROJECT.md)
**License:** MIT

Current dataset: **174 shoes** across **18 brands** and **11 foam families**, drawn from 13 sheets of a hand-curated xlsx. Filtering, sorting, comparison, and the insights charts all run entirely in the browser.

---

## Quick start

Requirements: **Node 20+**, **Python 3.10+**, `git`.

```bash
# 1. install JS deps
npm install

# 2. install Python ETL deps
pip install -r requirements.txt

# 3. (re)generate JSON from the xlsx
npm run data

# 4. dev server  →  http://localhost:3000
npm run dev
```

## Production build

```bash
npm run build      # static export to ./out
npx serve out      # serve locally for sanity check
```

The site is fully static — no server runtime, no API routes, no database.

---

## Pages

| Route | What it does |
|---|---|
| `/` | Browse — filter sidebar (search, brand, type, foam, sheet, price, weight, HER, FER, drop) + sortable table |
| `/shoe/[id]` | Detail — all fields grouped (Performance · Geometry · Midsole/Outsole · Price · Notes) + similar shoes |
| `/compare` | Up to 4 shoes side-by-side with radar chart and best-per-row diff table; share via `?ids=a,b,c,d` |
| `/insights` | 6 charts — HER×Price, HER×Weight Pareto, avg HER by foam, avg HER by brand, drop & price histograms |
| `/about` | Field legend, data-source note, disclaimer |

A floating "Compare (n)" pill is visible on every page once you've ticked at least one shoe.

---

## Data refresh workflow

```bash
# 1. edit data/EnergyReturn-ShockAbsorption.xlsx
# 2. regenerate JSON
npm run data
# 3. commit + push — GitHub Actions auto-deploys
git add -A
git commit -m "data: refresh $(date +%F)"
git push
```

End-to-end: ~2 minutes from `git push` to live.

---

## Hosting

The currently active deploy target is **GitHub Pages**, via the workflow at
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). It runs on every
push to `main`: Python ETL → `npm install` → `next build` → upload `out/` →
publish.

### To deploy to a fresh GitHub Pages site
1. Push the repo to GitHub.
2. Settings → Pages → Source: **GitHub Actions**.
3. Push to `main`. Site goes live at `https://<user>.github.io/<repo>/`.
4. Base path is set automatically from `NEXT_PUBLIC_BASE_PATH=/${{ repo.name }}`
   so the repo name *is* the URL path — keep them in sync if you fork.

### Alternative free hosts (same `out/` works on all of them)

**Cloudflare Pages** — no credit card.
1. dash.cloudflare.com → Workers & Pages → Create → Pages → connect this repo.
2. Framework preset: **Next.js (Static HTML Export)**.
3. Build: `npm run build` · Output: `out`. URL: `<project>.pages.dev`.

**Vercel Hobby** — autodetects Next.js, no overrides needed.
1. https://vercel.com/new → import this repo. URL: `<project>.vercel.app`.

---

## Project layout

```
soldex/                            ← repo root = the Next.js app
├── app/                           ← App Router pages
├── components/                    ← BrowseView, ShoeDetail, ComparePage, InsightsView, CompareBar
├── lib/                           ← types, data, filter, derive, format
├── store/compare.ts               ← Zustand compare-cart (max 4, persisted)
├── styles/globals.css
├── public/data/                   ← shoes.json, meta.json (generated, committed)
├── data/                          ← xlsx source of truth + auto-converted markdown
├── scripts/build_data.py          ← ETL
├── docs/PROJECT.md                ← living spec
├── .github/workflows/deploy.yml   ← GH Pages CI
├── package.json · package-lock.json
├── next.config.mjs · tsconfig.json · tailwind.config.js · postcss.config.mjs
├── .nvmrc · .editorconfig · .eslintrc.json · .prettierrc · .gitattributes · .gitignore
├── requirements.txt               ← Python ETL deps
├── LICENSE                        ← MIT
└── README.md
```

## Scripts

| Command           | What it does                              |
|-------------------|-------------------------------------------|
| `npm run dev`     | Next dev server with HMR                  |
| `npm run build`   | Static export to `./out`                  |
| `npm run start`   | Serve the production build                |
| `npm run lint`    | ESLint via `next lint`                    |
| `npm run format`  | Prettier write                            |
| `npm run data`    | Run ETL: xlsx → `public/data/*.json`      |

## Tech stack (actual)

- **Next.js 15** (App Router, static export) + **React 19** + **TypeScript 5**
- **Tailwind CSS 3** — utility-first, plain config, dark theme baked in
- **Recharts** for radar / scatter / bar charts
- **Zustand** (persisted to `localStorage`) for the compare-cart
- **Python 3.10+** with **pandas** + **openpyxl** for the ETL
- ESLint (`next/core-web-vitals`) + Prettier

See [docs/PROJECT.md §5](docs/PROJECT.md#5-tech-stack) for what was specified vs. shipped vs. deferred.

## Notes

- The full dataset (~50 KB JSON) is bundled into the JS — first paint includes everything; all filtering is instant.
- `noindex,nofollow` is set in `app/layout.tsx` — not intended for search-engine discovery.
- Compare cart is persisted in `localStorage` *and* reflected in `?ids=` for sharing.
- `public/data/{shoes,meta}.json` is committed so any host can deploy without needing Python.

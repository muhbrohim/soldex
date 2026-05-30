# Soldex

> **Sole Index** — a personal, data-first running-shoe database.
> Pure measured data. No reviews, no opinions, no recommender.

[Spec](docs/PROJECT.md) · MIT licensed

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

## Data refresh workflow

```bash
# 1. edit data/EnergyReturn-ShockAbsorption.xlsx
# 2. regenerate JSON
npm run data
# 3. commit + push — your free host auto-deploys
git add -A && git commit -m "data: refresh $(date +%F)"
git push
```

## Free hosting

All produce identical results because `out/` is plain HTML + JS + JSON.

### GitHub Pages (this repo's default)
A workflow at `.github/workflows/deploy.yml` runs the Python ETL, builds, and
publishes on every push to `main`.

1. Repo Settings → Pages → Source: **GitHub Actions**.
2. Push to `main`.
3. Site at `https://<user>.github.io/<repo>/` — base path is set automatically
   from `NEXT_PUBLIC_BASE_PATH=/${{ repo.name }}`.

### Cloudflare Pages (no credit card)
1. dash.cloudflare.com → Workers & Pages → Create → Pages → connect this repo.
2. Framework preset: **Next.js (Static HTML Export)**.
3. Build command: `npm run build` · Build output: `out`.
4. URL: `<project>.pages.dev`.

### Vercel Hobby
1. https://vercel.com/new → import this repo.
2. Vercel autodetects Next.js; no overrides needed.
3. URL: `<project>.vercel.app`.

## Project layout

```
soldex/                            ← repo root = the Next.js app
├── app/                           ← App Router pages
├── components/                    ← BrowseView, ShoeDetail, ComparePage, …
├── lib/                           ← types, data, filter, derive, format
├── store/compare.ts               ← Zustand compare-cart (max 4, persisted)
├── styles/globals.css
├── public/data/                   ← shoes.json, meta.json (generated)
├── data/                          ← xlsx source of truth
├── scripts/build_data.py          ← ETL
├── docs/PROJECT.md                ← spec
├── .github/workflows/deploy.yml   ← GH Pages CI
└── …                              ← next/tailwind/eslint/prettier configs
```

## Scripts

| Command         | What it does                              |
|-----------------|-------------------------------------------|
| `npm run dev`   | Next dev server with HMR                  |
| `npm run build` | Static export to `./out`                  |
| `npm run start` | Serve the production build                |
| `npm run lint`  | Next.js / ESLint                          |
| `npm run format`| Prettier write                            |
| `npm run data`  | Run ETL: xlsx → `public/data/*.json`      |

## Notes

- Bundles the full dataset (~50 KB JSON) into the JS — all filtering happens in the browser.
- `noindex,nofollow` is set in `app/layout.tsx` — not intended for search engines.
- Compare cart is persisted in `localStorage` *and* reflected in `?ids=` for sharing.

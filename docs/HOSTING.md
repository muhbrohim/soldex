# Hosting analysis

> Comparison of free-tier hosting options for Soldex, written during the
> v0.1 → v0.2 migration when we moved from a static GitHub Pages site to a
> dynamic Next.js app with Supabase auth + CRUD.

**Decision:** **Vercel Hobby** (front-end) + **Supabase Free** (Postgres + Auth + RLS).
This document records *why* — and what was rejected and why.

---

## 1. Constraints

Hard requirements that drove the decision:

| Constraint | Rationale |
|---|---|
| **Free** | Personal project, no revenue. |
| **No credit card** | Owner doesn't want to attach a card to a hobby account. SMS phone verification is acceptable. |
| **Public GitHub repo** | MIT, owner `muhbrohim`, repo `soldex`. Some hosts charge for private repos but allow public ones free. |
| **Next.js 15 App Router** | Rules out pure static-file hosts that can't run SSR / dynamic routes. |
| **Auth + Postgres** | Need RLS-backed CRUD for ~5 trusted users; not just a static dashboard. |
| **Indonesia-friendly latency** | Owner and friends are in Indonesia; want a CDN with Asian PoPs. |
| **noindex,nofollow** | Not for SEO; obscurity is part of the access model. No need for a marketing-grade host. |

Soft preferences:

- Zero-config Next.js deploys (Git push → live).
- Preview deployments per PR (nice-to-have).
- Sensible logs/observability without paying.
- Easy env-var management for the Supabase keys.

---

## 2. Front-end host: candidates

### 2.1 Vercel Hobby — **chosen**

| Aspect | Notes |
|---|---|
| Cost | Free; SMS phone verification only, no card. |
| Next.js support | First-party. Zero-config. App Router, RSC, ISR, edge functions all work. |
| Build minutes | 6000 min/mo — far more than this project will ever use. |
| Bandwidth | 100 GB/mo — trivially enough for ~5 users. |
| Functions | 100 GB-hrs/mo serverless execution. We use Supabase for data, so the FE just renders. |
| Preview deploys | Automatic per branch / PR. |
| Env vars | UI for Production / Preview / Development scopes. Clean. |
| Region | Default `iad1` (US East). Asia regions available on paid tiers. Acceptable since Supabase is the data plane and we can pick a Supabase region in Asia. |
| Logs | Built-in runtime + build logs, 1-day retention free. Enough for debugging. |
| Caveats | Commercial use is disallowed on Hobby (Soldex is personal — fine). 1 user/account on Hobby. |

**Verdict:** the obvious default for a Next.js App Router project that can't justify $20/mo Pro.

### 2.2 Cloudflare Pages

| Aspect | Notes |
|---|---|
| Cost | Free; no card required. |
| Next.js support | Works *as long as* you deploy via the `@cloudflare/next-on-pages` adapter and stay within the Workers runtime. App Router with Node-only APIs (e.g. some Supabase server helpers) needs care. |
| Bandwidth | Unlimited (subject to AUP) — best-in-class for free. |
| Functions | 100k Workers requests/day free. |
| Region | Global edge — best Indonesia latency of all candidates. |
| Preview deploys | Yes. |
| Caveats | Edge runtime is more restrictive than Vercel's hybrid model. We use SWR client-side and Supabase via the browser SDK, so this *would* work, but every dependency upgrade is a "does it still work on Workers?" gamble. |

**Verdict:** strong runner-up. Rejected because the Vercel path is friction-free and we don't currently need Cloudflare's bandwidth/edge. Easy to migrate to later if Vercel ever changes terms.

### 2.3 Netlify

| Aspect | Notes |
|---|---|
| Cost | Free starter; no card required. |
| Next.js support | Good — first-class Next adapter. |
| Bandwidth | 100 GB/mo. |
| Build minutes | 300 min/mo — tightest of the three. |
| Region | US-default, similar to Vercel. |

**Verdict:** functionally equivalent to Vercel for this app, but Vercel makes Next.js and has slightly better DX for it. No reason to pick Netlify over Vercel for a Next project unless you already use Netlify elsewhere.

### 2.4 GitHub Pages (the previous host)

| Aspect | Notes |
|---|---|
| Cost | Free; no card. |
| Next.js support | **Static export only.** Must run `output: 'export'`, lose dynamic routes, lose server components that fetch at request time, ship the entire dataset as a JSON bundle. |
| Bandwidth | Soft 100 GB/mo. |
| Region | GitHub's CDN — fine globally. |
| Caveats | We literally just removed `output: 'export'` to enable dynamic shoe routes and the Supabase-driven CRUD UI. Static-only hosts are no longer viable. |

**Verdict:** rejected. Was correct for v0.1 (pure static). Wrong for v0.2 once we added auth, mutations, and `/shoe/[id]` dynamic routes.

### 2.5 Render / Railway / Fly.io / Deno Deploy

All require either a credit card on file, have aggressively short free trials, or have an "asleep after N minutes of inactivity" cold-start tax that's painful for a dashboard-style app. Rejected up front.

---

## 3. Backend: Supabase Free — **chosen**

The migration from a static JSON file to a real database needs three things:
Postgres, an auth system, and a row-level security model. Doing all three on
the same free tier is the only sane play.

| Aspect | Notes |
|---|---|
| Cost | Free; no card. Sign-up via GitHub OAuth. |
| DB | 500 MB Postgres. Soldex's 174-shoe dataset is well under 1 MB; ample headroom. |
| Auth | Built-in email/password (we use the `@soldex.local` username trick). Up to 50 000 MAU on free. |
| RLS | First-class. Migrations live in `supabase/migrations/0001_init.sql`. |
| API | Auto-generated PostgREST + JS client. No backend code to write. |
| Region | Singapore region available — close to Indonesia. |
| Backups | 7-day point-in-time recovery. |
| Caveats | Project pauses after 7 days of inactivity (one click to resume). Acceptable for a personal app; if a friend hits a paused project they'll see one slow request, then it's fine. |

### Alternatives considered

| Option | Why not |
|---|---|
| **Neon** | Great free Postgres; you'd still need a separate auth provider (Clerk / Auth.js) → more moving pieces. |
| **PlanetScale** | Free tier was removed in 2024. |
| **Turso (libSQL)** | SQLite-flavoured; no built-in auth; RLS-like patterns would need to be hand-rolled. |
| **Firebase** | Different mental model (NoSQL), and we want SQL + RLS to keep the data model close to the spreadsheet. |
| **Self-host on a VPS** | Defeats the "free, no card" constraint and adds ops burden. |

---

## 4. Side-by-side summary

| Host | Card? | Next.js | Dynamic routes | Auth/DB included | Indonesia latency | Verdict |
|---|---|---|---|---|---|---|
| **Vercel Hobby + Supabase** | No | First-class | Yes | Yes (Supabase) | Singapore via Supabase | **Chosen** |
| Cloudflare Pages + Supabase | No | Via adapter | Yes (edge) | Yes (Supabase) | Best | Strong fallback |
| Netlify + Supabase | No | Good | Yes | Yes (Supabase) | OK | Equivalent, no DX edge |
| GitHub Pages | No | Static-only | No | No | OK | Rejected (no dynamic routes) |
| Render / Railway / Fly | Card or sleeps | Yes | Yes | DB extra | Varies | Rejected (card or cold-start) |

---

## 5. Cost projection (back-of-envelope)

| Scenario | FE | DB | Total |
|---|---|---|---|
| Current (5 trusted users, ~100 page views/day) | $0 | $0 | **$0/mo** |
| 10× traffic (1 000 page views/day, 10 users) | $0 | $0 | **$0/mo** |
| 100× traffic + heavy writes | Vercel Pro $20 | Supabase Pro $25 | $45/mo |
| Outgrow Hobby's "personal use only" clause | Vercel Pro $20 | $0 | $20/mo |

The free tier covers Soldex's plausible growth curve by a wide margin. The
first paid line item, if it ever happens, is Vercel Pro to escape the
personal-use clause — and that's only if Soldex becomes a real product.

---

## 6. Migration path if Vercel ever becomes unworkable

We deliberately kept the architecture portable:

1. **All data fetching goes through SWR hooks in `lib/hooks.ts`.** They
   already have a bundled-JSON fallback when Supabase env vars are absent,
   so the FE can run anywhere — even on pure static hosts in degraded
   read-only mode.
2. **Supabase is consumed via the standard `@supabase/supabase-js` browser
   client.** It works identically from Vercel, Cloudflare Pages, Netlify,
   or a self-hosted container. No vendor lock-in to Vercel's runtime.
3. **No Vercel-specific APIs** (no `@vercel/postgres`, no `@vercel/kv`, no
   `next/og` with Vercel-only ImageResponse hacks). The `next.config.mjs`
   is plain.

Worst case: clone the repo, set the same env vars on Cloudflare Pages or
Netlify, run `npm run build`, point DNS. Estimated migration time: <30 minutes.

---

## 7. Open risks

| Risk | Mitigation |
|---|---|
| Supabase project pauses after 7 days inactivity | Friends visit it casually; if it ever pauses, the owner can resume in one click. Could also schedule a weekly cron-ping if it becomes annoying. |
| Vercel Hobby "no commercial use" clause | Soldex is explicitly personal and unlisted. Documented in the README and `noindex,nofollow` meta tag. |
| Supabase free tier policy changes | Schema lives in `supabase/migrations/` — portable to any Postgres. Auth would need replacement (Clerk free tier, Auth.js + own DB, etc.). |
| Vercel free tier policy changes | Cloudflare Pages is the documented fallback (§2.2). |

---

## 8. References

- Vercel Hobby limits: <https://vercel.com/docs/limits>
- Supabase Free tier: <https://supabase.com/pricing>
- Cloudflare Pages limits: <https://developers.cloudflare.com/pages/platform/limits/>
- Why we dropped static export: see `0001_init.sql` (dynamic data model) and
  commit `f8e51ae` (removal of `output: 'export'`).

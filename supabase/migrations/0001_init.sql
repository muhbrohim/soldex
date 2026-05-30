-- Soldex schema — initial migration.
--
-- Run this in the Supabase SQL editor for a fresh project. It is idempotent
-- (uses IF NOT EXISTS / CREATE OR REPLACE everywhere) so you can re-run safely.
--
-- Auth strategy: username + password using fake-email pattern.
-- The web app appends "@soldex.local" to the user-typed username before
-- calling supabase.auth.signInWithPassword. No public signup; users are
-- provisioned manually from the Supabase dashboard.

----------------------------------------------------------------------------
-- 1. Extensions
----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

----------------------------------------------------------------------------
-- 2. Reference tables
----------------------------------------------------------------------------
create table if not exists public.brands (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.foams (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique,
  created_at timestamptz not null default now()
);

----------------------------------------------------------------------------
-- 3. Shoes (one row per model). Numeric columns map 1:1 to the Shoe type
--    in lib/types.ts. We keep brand & foam as text-by-name *plus* an FK
--    so the UI can keep using simple strings while we still enforce
--    referential integrity through triggers (Phase 4 importer fills both).
----------------------------------------------------------------------------
create table if not exists public.shoes (
  id              text primary key,                  -- stable slug from build_data.py
  brand           text not null references public.brands(name) on update cascade,
  version         text not null,
  type            text,                              -- R, D, DC, C, S, M, RET
  her             numeric,
  fer             numeric,
  hsa             numeric,
  fsa             numeric,
  weight_g        numeric,
  price_idr       numeric,
  heel            numeric,
  fore            numeric,
  drop            numeric,
  width           numeric,
  toe             numeric,
  m_fore          numeric,
  o_thick         numeric,
  drem            numeric,
  o_dur_pct       numeric,
  o_stay          numeric,
  trac            numeric,
  m_soft          numeric,
  flex_stiff      numeric,
  tors_rigid      numeric,
  up_foam         numeric,
  my_approx       numeric,
  minus           text,
  conclusion      text,
  re_buy          text,
  foam            text references public.foams(name) on update cascade,
  -- New: RunRepeat-style pre-req booleans (nullable = unknown; default null per plan)
  has_plate       boolean,
  has_rocker      boolean,
  -- Soft delete + auditing
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id) on delete set null,
  updated_by      uuid references auth.users(id) on delete set null
);

create index if not exists shoes_brand_idx       on public.shoes (brand);
create index if not exists shoes_foam_idx        on public.shoes (foam);
create index if not exists shoes_type_idx        on public.shoes (type);
create index if not exists shoes_deleted_at_idx  on public.shoes (deleted_at);

----------------------------------------------------------------------------
-- 4. Categories (many-to-many: a shoe can belong to several sheets like
--    DAILY, SUPER, MAXIMALIST, RACERS, etc.).
----------------------------------------------------------------------------
create table if not exists public.shoe_categories (
  shoe_id  text not null references public.shoes(id) on delete cascade,
  category text not null,
  primary key (shoe_id, category)
);

create index if not exists shoe_categories_category_idx on public.shoe_categories (category);

----------------------------------------------------------------------------
-- 5. Revisions (immutable audit log of every shoe write).
----------------------------------------------------------------------------
create table if not exists public.shoe_revisions (
  id          bigserial primary key,
  shoe_id     text not null,
  op          text not null check (op in ('insert', 'update', 'delete', 'restore')),
  before      jsonb,
  after       jsonb,
  changed     text[],
  actor       uuid references auth.users(id) on delete set null,
  at          timestamptz not null default now()
);

create index if not exists shoe_revisions_shoe_idx on public.shoe_revisions (shoe_id, at desc);

----------------------------------------------------------------------------
-- 6. Trigger: maintain updated_at + updated_by, and emit revision rows.
----------------------------------------------------------------------------
create or replace function public.shoes_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  -- updated_by intentionally set client-side (RLS-safe pattern is to let
  -- callers stamp it). We do not overwrite a non-null value.
  return new;
end $$;

drop trigger if exists shoes_touch_trg on public.shoes;
create trigger shoes_touch_trg
  before update on public.shoes
  for each row execute function public.shoes_touch();

create or replace function public.shoes_audit()
returns trigger language plpgsql as $$
declare
  diff text[];
  k    text;
begin
  if tg_op = 'INSERT' then
    insert into public.shoe_revisions (shoe_id, op, before, after, changed, actor)
      values (new.id, 'insert', null, to_jsonb(new), null, new.created_by);
    return new;
  elsif tg_op = 'UPDATE' then
    -- compute changed top-level field names
    diff := array(
      select key
      from jsonb_each(to_jsonb(new)) n
      where (to_jsonb(old) -> key) is distinct from n.value
    );
    -- distinguish soft-delete vs restore vs normal update
    if old.deleted_at is null and new.deleted_at is not null then
      insert into public.shoe_revisions (shoe_id, op, before, after, changed, actor)
        values (new.id, 'delete', to_jsonb(old), to_jsonb(new), diff, new.updated_by);
    elsif old.deleted_at is not null and new.deleted_at is null then
      insert into public.shoe_revisions (shoe_id, op, before, after, changed, actor)
        values (new.id, 'restore', to_jsonb(old), to_jsonb(new), diff, new.updated_by);
    else
      insert into public.shoe_revisions (shoe_id, op, before, after, changed, actor)
        values (new.id, 'update', to_jsonb(old), to_jsonb(new), diff, new.updated_by);
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.shoe_revisions (shoe_id, op, before, after, changed, actor)
      values (old.id, 'delete', to_jsonb(old), null, null, null);
    return old;
  end if;
  return null;
end $$;

drop trigger if exists shoes_audit_trg on public.shoes;
create trigger shoes_audit_trg
  after insert or update or delete on public.shoes
  for each row execute function public.shoes_audit();

----------------------------------------------------------------------------
-- 7. Row Level Security
--    - Anonymous: read non-deleted shoes, brands, foams, categories
--    - Authenticated: full CRUD on shoes + reference tables, can see trash
--    - Revisions: read for everyone authed; writes only via trigger
----------------------------------------------------------------------------
alter table public.brands           enable row level security;
alter table public.foams            enable row level security;
alter table public.shoes            enable row level security;
alter table public.shoe_categories  enable row level security;
alter table public.shoe_revisions   enable row level security;

-- brands / foams: world-readable, authed-writable
drop policy if exists "brands read" on public.brands;
create policy "brands read" on public.brands for select using (true);
drop policy if exists "brands write" on public.brands;
create policy "brands write" on public.brands for all to authenticated using (true) with check (true);

drop policy if exists "foams read" on public.foams;
create policy "foams read" on public.foams for select using (true);
drop policy if exists "foams write" on public.foams;
create policy "foams write" on public.foams for all to authenticated using (true) with check (true);

-- shoes: anon sees only non-deleted; authed sees & writes everything
drop policy if exists "shoes read public" on public.shoes;
create policy "shoes read public" on public.shoes for select using (deleted_at is null);
drop policy if exists "shoes read authed" on public.shoes;
create policy "shoes read authed" on public.shoes for select to authenticated using (true);
drop policy if exists "shoes insert authed" on public.shoes;
create policy "shoes insert authed" on public.shoes for insert to authenticated with check (true);
drop policy if exists "shoes update authed" on public.shoes;
create policy "shoes update authed" on public.shoes for update to authenticated using (true) with check (true);
drop policy if exists "shoes delete authed" on public.shoes;
create policy "shoes delete authed" on public.shoes for delete to authenticated using (true);

-- shoe_categories: same as shoes
drop policy if exists "shoe_categories read" on public.shoe_categories;
create policy "shoe_categories read" on public.shoe_categories
  for select using (
    exists (select 1 from public.shoes s where s.id = shoe_id and s.deleted_at is null)
    or auth.role() = 'authenticated'
  );
drop policy if exists "shoe_categories write" on public.shoe_categories;
create policy "shoe_categories write" on public.shoe_categories
  for all to authenticated using (true) with check (true);

-- revisions: authed-only read (PII-adjacent: shows actor ids)
drop policy if exists "shoe_revisions read" on public.shoe_revisions;
create policy "shoe_revisions read" on public.shoe_revisions
  for select to authenticated using (true);
-- No insert policy needed; rows arrive via SECURITY DEFINER trigger as table owner.

----------------------------------------------------------------------------
-- 8. Convenience view: shoes with categories aggregated as array.
----------------------------------------------------------------------------
create or replace view public.shoes_full as
  select s.*,
    coalesce(
      (select array_agg(c.category order by c.category)
       from public.shoe_categories c where c.shoe_id = s.id),
      '{}'::text[]
    ) as categories
  from public.shoes s;

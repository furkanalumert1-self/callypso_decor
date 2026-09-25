-- Callypso Decor — Supabase schema. Run once in Supabase → SQL Editor.
-- Creates the `projects` table the app reads/writes (lib/data.ts), row-level
-- security so each user only sees their own rows, and seeds sample projects
-- for every new sign-up.

create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  room         jsonb not null,                       -- { "tr": "...", "en": "..." }
  place        text not null default '',
  style        text not null check (style in ('iskandinav','modern','bohem','japandi','akdeniz','endustriyel')),
  status       text not null default 'ready' check (status in ('uploaded','styling','ready','approved')),
  variants     int  not null default 1,
  saved        int  not null default 0,
  image_before text,                                 -- data URL of the uploaded photo
  image_after  text,                                 -- data URL / URL of the generated look
  updated_at   timestamptz not null default now()
);

create index if not exists projects_user_updated_idx on public.projects (user_id, updated_at desc);

alter table public.projects enable row level security;

drop policy if exists "projects_select_own" on public.projects;
drop policy if exists "projects_insert_own" on public.projects;
drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_delete_own" on public.projects;

create policy "projects_select_own" on public.projects for select using (auth.uid() = user_id);
create policy "projects_insert_own" on public.projects for insert with check (auth.uid() = user_id);
create policy "projects_update_own" on public.projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "projects_delete_own" on public.projects for delete using (auth.uid() = user_id);

-- Seed: every new user starts with a few sample projects (SVG demo renders).
create or replace function public.seed_sample_projects()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.projects (user_id, room, place, style, status, variants, saved) values
    (new.id, '{"tr":"Oturma odası","en":"Living room"}', 'Cihangir · Daire',  'iskandinav', 'ready',    6, 2),
    (new.id, '{"tr":"Yatak odası","en":"Bedroom"}',      'Moda · Çatı katı',  'japandi',    'approved', 8, 3),
    (new.id, '{"tr":"Mutfak","en":"Kitchen"}',           'Nişantaşı · Villa', 'modern',     'styling',  4, 1);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_seed_projects on auth.users;
create trigger on_auth_user_created_seed_projects
  after insert on auth.users
  for each row execute function public.seed_sample_projects();

-- ── Furniture catalogue (for furniture firms) ──────────────────────────────
-- Products a firm places into customers' room photos. Safe to re-run.

alter table public.projects add column if not exists products jsonb;   -- [{ id, name, sku, price }]

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  sku         text not null default '',
  category    text not null check (category in ('sofa','armchair','table','rug','lamp','storage','bed','decor')),
  price       numeric(12,2) not null default 0,                -- TRY
  width       int,                                             -- cm
  depth       int,
  height      int,
  image       text not null,                                   -- data URL of the product photo
  created_at  timestamptz not null default now()
);

create index if not exists products_user_created_idx on public.products (user_id, created_at desc);

alter table public.products enable row level security;

drop policy if exists "products_select_own" on public.products;
drop policy if exists "products_insert_own" on public.products;
drop policy if exists "products_update_own" on public.products;
drop policy if exists "products_delete_own" on public.products;

create policy "products_select_own" on public.products for select using (auth.uid() = user_id);
create policy "products_insert_own" on public.products for insert with check (auth.uid() = user_id);
create policy "products_update_own" on public.products for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "products_delete_own" on public.products for delete using (auth.uid() = user_id);

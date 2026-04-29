-- Seat Happens v0.2.35 Garching mensa menu cache.
-- Run this after supabase_room_campus_split_migration.sql.

create table if not exists public.mensa_menu_daily (
  id uuid primary key default gen_random_uuid(),
  campus text not null check (campus in ('garching')),
  menu_date date not null,
  location text not null default 'Mensa Garching',
  source_url text not null,
  fetched_at timestamptz not null default now(),
  prediction_model text not null default 'heuristic-v1',
  summary text not null default '',
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campus, menu_date)
);

create index if not exists idx_mensa_menu_daily_campus_date
on public.mensa_menu_daily(campus, menu_date desc);

drop trigger if exists set_mensa_menu_daily_updated_at on public.mensa_menu_daily;
create trigger set_mensa_menu_daily_updated_at
before update on public.mensa_menu_daily
for each row execute function public.set_updated_at();

alter table public.mensa_menu_daily enable row level security;

drop policy if exists "mensa menu read authenticated" on public.mensa_menu_daily;
create policy "mensa menu read authenticated"
on public.mensa_menu_daily for select
to authenticated
using (true);

notify pgrst, 'reload schema';

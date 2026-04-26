-- Seat Happens room reservation MVP migration.
-- Run this after the original supabase_schema.sql.

create table if not exists public.room_plans (
  id uuid primary key default gen_random_uuid(),
  captain_id uuid not null references public.profiles(id) on delete cascade,
  plan_date date not null,
  start_time time not null,
  end_time time not null,
  planned_arrival time,
  campus text not null default 'StudiTUM Innenstadt',
  room_type text not null check (room_type in ('large_classroom', 'small_room', 'medium_room')),
  actual_room_label text,
  topic text,
  discussion_mode text not null default 'quiet' check (discussion_mode in ('quiet', 'flexible', 'discussion')),
  max_capacity integer not null default 4 check (max_capacity between 1 and 40),
  status text not null default 'planned' check (status in ('planned', 'active', 'completed', 'cancelled')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_plan_members (
  id uuid primary key default gen_random_uuid(),
  room_plan_id uuid not null references public.room_plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'expected', 'confirmed', 'cancelled', 'released')),
  eta time,
  note text,
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_plan_id, user_id)
);

create index if not exists idx_room_plans_date_status on public.room_plans(plan_date, status);
create index if not exists idx_room_plans_captain on public.room_plans(captain_id, plan_date desc);
create index if not exists idx_room_members_plan on public.room_plan_members(room_plan_id);
create index if not exists idx_room_members_user on public.room_plan_members(user_id, created_at desc);

drop trigger if exists set_room_plans_updated_at on public.room_plans;
create trigger set_room_plans_updated_at
before update on public.room_plans
for each row execute function public.set_updated_at();

drop trigger if exists set_room_plan_members_updated_at on public.room_plan_members;
create trigger set_room_plan_members_updated_at
before update on public.room_plan_members
for each row execute function public.set_updated_at();

alter table public.room_plans enable row level security;
alter table public.room_plan_members enable row level security;

drop policy if exists "room plans read authenticated" on public.room_plans;
create policy "room plans read authenticated"
on public.room_plans for select
to authenticated
using (true);

drop policy if exists "room plans captain insert" on public.room_plans;
create policy "room plans captain insert"
on public.room_plans for insert
to authenticated
with check (captain_id = auth.uid());

drop policy if exists "room plans captain or admin update" on public.room_plans;
create policy "room plans captain or admin update"
on public.room_plans for update
to authenticated
using (captain_id = auth.uid() or public.is_admin())
with check (captain_id = auth.uid() or public.is_admin());

drop policy if exists "room plans captain or admin delete" on public.room_plans;
create policy "room plans captain or admin delete"
on public.room_plans for delete
to authenticated
using (captain_id = auth.uid() or public.is_admin());

drop policy if exists "room members read authenticated" on public.room_plan_members;
create policy "room members read authenticated"
on public.room_plan_members for select
to authenticated
using (true);

drop policy if exists "room members self captain admin insert" on public.room_plan_members;
create policy "room members self captain admin insert"
on public.room_plan_members for insert
to authenticated
with check (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.room_plans rp
    where rp.id = room_plan_id
      and rp.captain_id = auth.uid()
  )
);

drop policy if exists "room members self captain admin update" on public.room_plan_members;
create policy "room members self captain admin update"
on public.room_plan_members for update
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.room_plans rp
    where rp.id = room_plan_id
      and rp.captain_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.room_plans rp
    where rp.id = room_plan_id
      and rp.captain_id = auth.uid()
  )
);

drop policy if exists "room members self captain admin delete" on public.room_plan_members;
create policy "room members self captain admin delete"
on public.room_plan_members for delete
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.room_plans rp
    where rp.id = room_plan_id
      and rp.captain_id = auth.uid()
  )
);

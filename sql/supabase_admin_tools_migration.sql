-- Seat Happens v0.2.9 admin tools.
-- Run this after supabase_room_plan_time_guard_migration.sql.

create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

alter table public.app_settings enable row level security;

drop policy if exists "app settings read authenticated" on public.app_settings;
create policy "app settings read authenticated"
on public.app_settings for select
to authenticated
using (key in ('admin_emergency_phone'));

drop policy if exists "app settings admin insert" on public.app_settings;
create policy "app settings admin insert"
on public.app_settings for insert
to authenticated
with check (public.is_admin());

drop policy if exists "app settings admin update" on public.app_settings;
create policy "app settings admin update"
on public.app_settings for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_direct_messages_recipient_created
on public.direct_messages(recipient_id, created_at desc);

create index if not exists idx_direct_messages_sender_created
on public.direct_messages(sender_id, created_at desc);

alter table public.direct_messages enable row level security;

drop policy if exists "direct messages read participants or admin" on public.direct_messages;
create policy "direct messages read participants or admin"
on public.direct_messages for select
to authenticated
using (
  sender_id = auth.uid()
  or recipient_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "direct messages admin insert" on public.direct_messages;
create policy "direct messages admin insert"
on public.direct_messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and public.is_admin()
);

drop policy if exists "direct messages recipient or admin update" on public.direct_messages;
create policy "direct messages recipient or admin update"
on public.direct_messages for update
to authenticated
using (
  recipient_id = auth.uid()
  or public.is_admin()
)
with check (
  recipient_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "direct messages admin delete" on public.direct_messages;
create policy "direct messages admin delete"
on public.direct_messages for delete
to authenticated
using (public.is_admin());

notify pgrst, 'reload schema';

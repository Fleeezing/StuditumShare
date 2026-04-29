-- Seat Happens v0.2.11 room member time tracking.
-- Run after supabase_admin_tools_migration.sql.

alter table public.room_plan_members
  add column if not exists planned_leave_at time,
  add column if not exists released_at timestamptz;

create index if not exists idx_room_members_released_at
on public.room_plan_members(released_at)
where released_at is not null;

notify pgrst, 'reload schema';

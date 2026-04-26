-- Seat Happens v0.2.3 arrival updates.
-- Run this after supabase_room_edit_lock_migration.sql.

alter table public.room_plans
add column if not exists guest_hold_count integer not null default 0;

alter table public.room_plans
drop constraint if exists room_plans_guest_hold_count_check;

alter table public.room_plans
add constraint room_plans_guest_hold_count_check
check (guest_hold_count between 0 and 40);

create or replace function public.prevent_late_room_plan_edits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_start timestamptz;
begin
  if auth.uid() is null then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  old_start := public.room_plan_starts_at(old.plan_date, old.start_time);

  if old_start - now() <= interval '12 hours' then
    if new.plan_date is distinct from old.plan_date
       or new.start_time is distinct from old.start_time
       or new.end_time is distinct from old.end_time
       or new.planned_arrival is distinct from old.planned_arrival
       or new.room_type is distinct from old.room_type
       or new.topic is distinct from old.topic
       or new.discussion_mode is distinct from old.discussion_mode then
      raise exception 'Room plan core details are locked 12 hours before start.';
    end if;
  end if;

  return new;
end;
$$;

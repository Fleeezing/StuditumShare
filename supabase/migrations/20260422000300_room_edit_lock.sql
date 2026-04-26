-- Seat Happens v0.2.1 room edit lock.
-- Run this after supabase_room_mvp_migration.sql.

create or replace function public.room_plan_starts_at(plan_date date, start_time time)
returns timestamptz
language sql
stable
as $$
  select (plan_date::timestamp + start_time)::timestamptz;
$$;

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
       or new.discussion_mode is distinct from old.discussion_mode
       or new.max_capacity is distinct from old.max_capacity
       or new.note is distinct from old.note then
      raise exception 'Room plan core details are locked 12 hours before start.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_late_room_plan_edits_before_update on public.room_plans;
create trigger prevent_late_room_plan_edits_before_update
before update on public.room_plans
for each row execute function public.prevent_late_room_plan_edits();

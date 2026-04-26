-- Seat Happens v0.2.7 room plan time guard.
-- Run after supabase_one_captain_plan_per_day_migration.sql.

create or replace function public.validate_room_plan_time()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.end_time <= new.start_time then
    raise exception 'Room plan end time must be after start time.';
  end if;

  if new.status = 'planned'
     and public.room_plan_starts_at(new.plan_date, new.start_time) <= now() then
    raise exception 'Room plan start time cannot be in the past.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_room_plan_time_before_write on public.room_plans;
create trigger validate_room_plan_time_before_write
before insert or update on public.room_plans
for each row execute function public.validate_room_plan_time();

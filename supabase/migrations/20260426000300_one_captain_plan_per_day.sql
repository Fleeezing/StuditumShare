-- Seat Happens v0.2.6 one Seat Captain plan per day.
-- Run after supabase_room_cancel_timing_migration.sql.
--
-- This allows a Seat Captain to create a new plan on the same date only after
-- the earlier plan is cancelled. Planned, active, and completed plans all count.

create unique index if not exists room_plans_one_open_plan_per_captain_day
on public.room_plans (captain_id, plan_date)
where status <> 'cancelled';

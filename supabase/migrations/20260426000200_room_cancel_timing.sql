-- Seat Happens v0.2.3 cancellation timing.
-- Run this after supabase_room_arrival_updates_migration.sql.

alter table public.room_plans
add column if not exists cancelled_at timestamptz;

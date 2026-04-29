-- Seat Happens campus split for Innenstadt and Garching StudiTUM.
-- Run after room member time tracking migration.

alter table public.room_plans
  add column if not exists campus text not null default 'StudiTUM Innenstadt';

update public.room_plans
set campus = case
  when lower(coalesce(campus, '')) like '%garching%' then 'StudiTUM Garching'
  else 'StudiTUM Innenstadt'
end
where campus is null
   or trim(campus) = ''
   or lower(campus) in ('main', 'main campus', 'studitum innenstadt', 'innenstadt')
   or lower(campus) like '%garching%';

alter table public.room_plans
  alter column campus set default 'StudiTUM Innenstadt';

alter table public.room_plans
  alter column campus set not null;

create index if not exists idx_room_plans_campus_date_status
on public.room_plans(campus, plan_date, status);

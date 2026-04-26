-- Study group planner schema for Supabase.
-- Run this once in Supabase SQL Editor.
-- Do not paste service_role keys into the frontend.

create extension if not exists citext;
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique,
  nickname text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired_username text;
  desired_nickname text;
  desired_role text;
begin
  desired_username := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'user_' || substr(new.id::text, 1, 8)
  );

  desired_nickname := coalesce(
    nullif(new.raw_user_meta_data->>'nickname', ''),
    desired_username
  );

  desired_role := 'user';
  if lower(desired_username) = 'fleeeezing'
     and coalesce(new.raw_user_meta_data->>'admin_setup_code', '') = 'admin_X4W9Q2M7Fleeeezing'
     and not exists (select 1 from public.profiles where role = 'admin') then
    desired_role := 'admin';
  end if;

  insert into public.profiles (id, username, nickname, role)
  values (new.id, desired_username, desired_nickname, desired_role)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Direct SQL Editor / backend maintenance operations do not carry auth.uid().
  -- Browser users always do, so this still blocks client-side role escalation.
  if auth.uid() is null then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Only admins can change roles.';
  end if;

  if new.username is distinct from old.username then
    raise exception 'Only admins can change usernames.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_role_before_update on public.profiles;
create trigger protect_profile_role_before_update
before update on public.profiles
for each row execute function public.protect_profile_role();

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  name text not null,
  color text not null default '#2368d8',
  archived_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_tasks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  week_label text not null,
  title text not null,
  details text,
  task_type text not null default 'required' check (task_type in ('required', 'bonus', 'optional')),
  created_by uuid not null references public.profiles(id) on delete cascade,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_courses (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table if not exists public.user_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_shared_task_id uuid references public.shared_tasks(id) on delete set null,
  course_id uuid references public.courses(id) on delete set null,
  week_label text,
  title text not null,
  details text,
  is_custom boolean not null default false,
  done boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  session_date date not null,
  start_time time,
  place text not null default 'Main campus',
  note text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.session_rsvps (
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'maybe' check (status in ('yes', 'maybe', 'no')),
  arrival_time time,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null default 'general',
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shared_tasks_course_week on public.shared_tasks(course_id, week_label, archived_at);
create index if not exists idx_shared_tasks_created_by on public.shared_tasks(created_by);
create index if not exists idx_user_courses_user on public.user_courses(user_id);
create index if not exists idx_user_courses_course on public.user_courses(course_id);
create index if not exists idx_user_tasks_user_week on public.user_tasks(user_id, week_label);
create index if not exists idx_user_tasks_source on public.user_tasks(source_shared_task_id);
create index if not exists idx_study_sessions_date on public.study_sessions(session_date, archived_at);
create index if not exists idx_session_rsvps_session on public.session_rsvps(session_id);
create index if not exists idx_feedback_user_created on public.feedback(user_id, created_at desc);
create index if not exists idx_feedback_status_created on public.feedback(status, created_at desc);
create index if not exists idx_chat_messages_created on public.chat_messages(created_at desc);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_courses_updated_at on public.courses;
create trigger set_courses_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

drop trigger if exists set_shared_tasks_updated_at on public.shared_tasks;
create trigger set_shared_tasks_updated_at
before update on public.shared_tasks
for each row execute function public.set_updated_at();

drop trigger if exists set_user_tasks_updated_at on public.user_tasks;
create trigger set_user_tasks_updated_at
before update on public.user_tasks
for each row execute function public.set_updated_at();

drop trigger if exists set_study_sessions_updated_at on public.study_sessions;
create trigger set_study_sessions_updated_at
before update on public.study_sessions
for each row execute function public.set_updated_at();

drop trigger if exists set_session_rsvps_updated_at on public.session_rsvps;
create trigger set_session_rsvps_updated_at
before update on public.session_rsvps
for each row execute function public.set_updated_at();

drop trigger if exists set_feedback_updated_at on public.feedback;
create trigger set_feedback_updated_at
before update on public.feedback
for each row execute function public.set_updated_at();

drop trigger if exists set_chat_messages_updated_at on public.chat_messages;
create trigger set_chat_messages_updated_at
before update on public.chat_messages
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.shared_tasks enable row level security;
alter table public.user_courses enable row level security;
alter table public.user_tasks enable row level security;
alter table public.study_sessions enable row level security;
alter table public.session_rsvps enable row level security;
alter table public.feedback enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "profiles read authenticated" on public.profiles;
create policy "profiles read authenticated"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "profiles update own or admin" on public.profiles;
create policy "profiles update own or admin"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "courses read authenticated" on public.courses;
create policy "courses read authenticated"
on public.courses for select
to authenticated
using (archived_at is null or public.is_admin());

drop policy if exists "courses admin insert" on public.courses;
create policy "courses admin insert"
on public.courses for insert
to authenticated
with check (public.is_admin());

drop policy if exists "courses admin update" on public.courses;
create policy "courses admin update"
on public.courses for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "courses admin delete" on public.courses;
create policy "courses admin delete"
on public.courses for delete
to authenticated
using (public.is_admin());

drop policy if exists "shared tasks read authenticated" on public.shared_tasks;
create policy "shared tasks read authenticated"
on public.shared_tasks for select
to authenticated
using (archived_at is null or public.is_admin());

drop policy if exists "shared tasks user insert" on public.shared_tasks;
create policy "shared tasks user insert"
on public.shared_tasks for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "shared tasks owner or admin update" on public.shared_tasks;
create policy "shared tasks owner or admin update"
on public.shared_tasks for update
to authenticated
using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());

drop policy if exists "shared tasks owner or admin delete" on public.shared_tasks;
create policy "shared tasks owner or admin delete"
on public.shared_tasks for delete
to authenticated
using (created_by = auth.uid() or public.is_admin());

drop policy if exists "user courses read authenticated" on public.user_courses;
create policy "user courses read authenticated"
on public.user_courses for select
to authenticated
using (true);

drop policy if exists "user courses own insert" on public.user_courses;
create policy "user courses own insert"
on public.user_courses for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "user courses own delete" on public.user_courses;
create policy "user courses own delete"
on public.user_courses for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "user tasks read authenticated" on public.user_tasks;
create policy "user tasks read authenticated"
on public.user_tasks for select
to authenticated
using (true);

drop policy if exists "user tasks own insert" on public.user_tasks;
create policy "user tasks own insert"
on public.user_tasks for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "user tasks own update" on public.user_tasks;
create policy "user tasks own update"
on public.user_tasks for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "user tasks own delete" on public.user_tasks;
create policy "user tasks own delete"
on public.user_tasks for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "study sessions read authenticated" on public.study_sessions;
create policy "study sessions read authenticated"
on public.study_sessions for select
to authenticated
using (archived_at is null or public.is_admin());

drop policy if exists "study sessions user insert" on public.study_sessions;
create policy "study sessions user insert"
on public.study_sessions for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "study sessions creator or admin update" on public.study_sessions;
create policy "study sessions creator or admin update"
on public.study_sessions for update
to authenticated
using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());

drop policy if exists "study sessions creator or admin delete" on public.study_sessions;
create policy "study sessions creator or admin delete"
on public.study_sessions for delete
to authenticated
using (created_by = auth.uid() or public.is_admin());

drop policy if exists "session rsvps read authenticated" on public.session_rsvps;
create policy "session rsvps read authenticated"
on public.session_rsvps for select
to authenticated
using (true);

drop policy if exists "session rsvps own insert" on public.session_rsvps;
create policy "session rsvps own insert"
on public.session_rsvps for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "session rsvps own update" on public.session_rsvps;
create policy "session rsvps own update"
on public.session_rsvps for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "session rsvps own delete" on public.session_rsvps;
create policy "session rsvps own delete"
on public.session_rsvps for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "feedback admin read" on public.feedback;
create policy "feedback admin read"
on public.feedback for select
to authenticated
using (public.is_admin());

drop policy if exists "feedback user insert" on public.feedback;
create policy "feedback user insert"
on public.feedback for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "feedback admin update" on public.feedback;
create policy "feedback admin update"
on public.feedback for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "feedback admin delete" on public.feedback;
create policy "feedback admin delete"
on public.feedback for delete
to authenticated
using (public.is_admin());

drop policy if exists "chat read authenticated" on public.chat_messages;
create policy "chat read authenticated"
on public.chat_messages for select
to authenticated
using (deleted_at is null or public.is_admin());

drop policy if exists "chat own insert" on public.chat_messages;
create policy "chat own insert"
on public.chat_messages for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "chat own update" on public.chat_messages;
create policy "chat own update"
on public.chat_messages for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "chat own delete" on public.chat_messages;
create policy "chat own delete"
on public.chat_messages for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

insert into public.courses (slug, name, color)
values
  ('rd', 'RD', '#2368d8'),
  ('i2ros', 'i2ros', '#0f766e'),
  ('i2dl', 'i2dl', '#6d54c8')
on conflict (slug) do nothing;

-- First admin bootstrap:
-- Register username "Fleeeezing" with admin setup code "admin_X4W9Q2M7Fleeeezing".
-- The trigger only grants admin if there is no existing admin yet.

-- LifeMode planning: reusable routines, weekly tasks, and per-day completion history.
create table if not exists public.schedule_routines (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 mode text not null check (mode in ('student','gym','career','business','law','creator')),
 name text not null check (char_length(trim(name)) between 1 and 80),
 routine_type text not null check (routine_type in ('college_days','weekend','exam','custom')),
 active_days smallint[] not null default array[1,2,3,4,5]::smallint[],
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (cardinality(active_days) between 1 and 7 and active_days <@ array[0,1,2,3,4,5,6]::smallint[])
);
create table if not exists public.schedule_tasks (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 routine_id uuid not null references public.schedule_routines(id) on delete cascade,
 title text not null check (char_length(trim(title)) between 1 and 160),
 day_of_week smallint not null check (day_of_week between 0 and 6),
 start_time time,
 end_time time,
 sort_order integer not null default 0 check (sort_order >= 0),
 created_at timestamptz not null default now(),
 check (start_time is null or end_time is null or end_time > start_time)
);
create table if not exists public.schedule_task_completions (
 task_id uuid not null references public.schedule_tasks(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 completed_on date not null default current_date,
 completed_at timestamptz not null default now(),
 primary key (task_id, completed_on)
);
create index if not exists schedule_routines_user_created_idx on public.schedule_routines(user_id,created_at);
create index if not exists schedule_tasks_user_routine_day_idx on public.schedule_tasks(user_id,routine_id,day_of_week,sort_order);
create index if not exists schedule_completions_user_date_idx on public.schedule_task_completions(user_id,completed_on);
alter table public.schedule_routines enable row level security;
alter table public.schedule_tasks enable row level security;
alter table public.schedule_task_completions enable row level security;
drop policy if exists "Users manage own schedule routines" on public.schedule_routines;
create policy "Users manage own schedule routines" on public.schedule_routines for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Users manage own schedule tasks" on public.schedule_tasks;
create policy "Users manage own schedule tasks" on public.schedule_tasks for all to authenticated
using ((select auth.uid())=user_id and exists(select 1 from public.schedule_routines r where r.id=schedule_tasks.routine_id and r.user_id=(select auth.uid())))
with check ((select auth.uid())=user_id and exists(select 1 from public.schedule_routines r where r.id=schedule_tasks.routine_id and r.user_id=(select auth.uid())));
drop policy if exists "Users manage own schedule task completions" on public.schedule_task_completions;
create policy "Users manage own schedule task completions" on public.schedule_task_completions for all to authenticated
using ((select auth.uid())=user_id and exists(select 1 from public.schedule_tasks t where t.id=schedule_task_completions.task_id and t.user_id=(select auth.uid())))
with check ((select auth.uid())=user_id and exists(select 1 from public.schedule_tasks t where t.id=schedule_task_completions.task_id and t.user_id=(select auth.uid())));
drop trigger if exists schedule_routines_set_updated_at on public.schedule_routines;
create trigger schedule_routines_set_updated_at before update on public.schedule_routines for each row execute function public.set_updated_at();
grant select,insert,update,delete on public.schedule_routines to authenticated;
grant select,insert,update,delete on public.schedule_tasks to authenticated;
grant select,insert,update,delete on public.schedule_task_completions to authenticated;

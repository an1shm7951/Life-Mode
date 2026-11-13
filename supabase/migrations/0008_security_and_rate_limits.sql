-- Security hardening and shared AI Buddy rate limiting.
-- Apply only after reviewing this migration in the pull request.

begin;

-- Profiles are private by default. Under-18 accounts cannot opt into public discovery.
update public.profiles
set is_public = false
where age_band = 'under_18' and is_public = true;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (age_band = 'adult' or is_public = false)
);

-- Do not expose raw profile rows to anonymous clients. Public discovery uses
-- a narrow, explicitly allow-listed view instead.
revoke select on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

create or replace view public.public_profiles
with (security_barrier = true)
as
select
  user_id,
  display_name,
  active_mode,
  bio,
  skills,
  created_at
from public.profiles
where is_public = true
  and age_band = 'adult';

revoke all on public.public_profiles from public;
grant select on public.public_profiles to anon, authenticated;

-- Keep raw proof rows private. The public view intentionally omits evidence
-- paths, file names, storage metadata, and other private fields.
revoke select on public.proof_posts from anon;
grant select, insert, update, delete on public.proof_posts to authenticated;

create or replace view public.public_proof_posts
with (security_barrier = true)
as
select
  proof.id,
  proof.user_id,
  proof.mode,
  proof.text,
  proof.visibility,
  proof.created_at
from public.proof_posts as proof
join public.profiles as profile
  on profile.user_id = proof.user_id
where profile.is_public = true
  and profile.age_band = 'adult'
  and proof.visibility in ('profile', 'public');

revoke all on public.public_proof_posts from public;
grant select on public.public_proof_posts to anon, authenticated;

-- A database-backed limiter is shared across Vercel serverless instances.
create table if not exists public.ai_buddy_rate_limit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default clock_timestamp()
);

create index if not exists ai_buddy_rate_limit_user_time_idx
  on public.ai_buddy_rate_limit_events (user_id, occurred_at desc);

alter table public.ai_buddy_rate_limit_events enable row level security;
revoke all on public.ai_buddy_rate_limit_events from public, anon, authenticated;

create or replace function public.consume_ai_buddy_rate_limit(
  p_user_id uuid,
  p_limit integer default 20,
  p_window_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  request_count integer;
  window_start timestamptz;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  if p_limit < 1 or p_window_seconds < 1 or p_window_seconds > 3600 then
    raise exception 'Invalid rate-limit configuration' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  window_start := clock_timestamp() - make_interval(secs => p_window_seconds);

  delete from public.ai_buddy_rate_limit_events
  where user_id = p_user_id
    and occurred_at < window_start;

  select count(*)::integer
  into request_count
  from public.ai_buddy_rate_limit_events
  where user_id = p_user_id
    and occurred_at >= window_start;

  if request_count >= p_limit then
    return false;
  end if;

  insert into public.ai_buddy_rate_limit_events (user_id)
  values (p_user_id);

  return true;
end;
$function$;

revoke all on function public.consume_ai_buddy_rate_limit(uuid, integer, integer) from public, anon;
grant execute on function public.consume_ai_buddy_rate_limit(uuid, integer, integer) to authenticated;

-- Supporting indexes for the foreign-key lookups flagged by Supabase's advisor.
create index if not exists ai_buddy_history_user_created_idx
  on public.ai_buddy_history (user_id, created_at desc);
create index if not exists finance_goals_user_idx
  on public.finance_goals (user_id);
create index if not exists finance_transactions_user_occurred_idx
  on public.finance_transactions (user_id, occurred_at desc);
create index if not exists opportunity_actions_opportunity_idx
  on public.opportunity_actions (opportunity_id);
create index if not exists proof_posts_user_created_idx
  on public.proof_posts (user_id, created_at desc);
create index if not exists respect_locks_target_user_idx
  on public.respect_locks (target_user_id);
create index if not exists schedule_tasks_routine_idx
  on public.schedule_tasks (routine_id);
create index if not exists subscriptions_user_idx
  on public.subscriptions (user_id);

commit;

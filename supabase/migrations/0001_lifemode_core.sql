-- LifeMode core schema
-- Run this in Supabase SQL Editor after creating the project.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null default 'Builder',
  age_band text not null default 'adult' check (age_band in ('under_18', 'adult')),
  active_mode text not null default 'student' check (active_mode in ('student', 'gym', 'career', 'business', 'law', 'creator')),
  bio text not null default 'Building proof every week.',
  skills text[] not null default '{}',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('student', 'gym', 'career', 'business', 'law', 'creator')),
  title text not null,
  done boolean not null default false,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.proof_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('student', 'gym', 'career', 'business', 'law', 'creator')),
  text text not null,
  media_url text,
  visibility text not null default 'private' check (visibility in ('private', 'profile', 'public')),
  created_at timestamptz not null default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('job', 'internship', 'freelance', 'scholarship', 'competition', 'startup_role')),
  title text not null,
  organization text not null,
  location text not null default 'Remote',
  mode text not null check (mode in ('student', 'gym', 'career', 'business', 'law', 'creator')),
  tags text[] not null default '{}',
  source text not null default 'manual',
  verified boolean not null default false,
  apply_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.opportunity_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  status text not null default 'saved' check (status in ('saved', 'applied', 'interview', 'rejected', 'won')),
  notes text not null default '',
  deadline date,
  follow_up date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

create table if not exists public.connection_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('student', 'gym', 'career', 'business', 'law', 'creator')),
  intent text not null check (intent in ('private', 'accountability', 'practice_partner', 'mentor', 'collaborator', 'professional_network', 'dating')),
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, mode, intent)
);

create table if not exists public.respect_locks (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('not_interested', 'block', 'report')),
  created_at timestamptz not null default now(),
  unique (actor_user_id, target_user_id)
);

create table if not exists public.ai_buddy_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('student', 'gym', 'career', 'business', 'law', 'creator')),
  buddy_mode text not null,
  prompt text not null,
  mood text,
  message text not null,
  next_actions text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense', 'transfer', 'payment')),
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'INR',
  category text not null default 'general',
  note text not null default '',
  payment_method text,
  payment_reference text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.finance_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  category text not null,
  limit_amount numeric(12, 2) not null check (limit_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month, category)
);

create table if not exists public.finance_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_amount numeric(12, 2) not null check (target_amount >= 0),
  current_amount numeric(12, 2) not null default 0 check (current_amount >= 0),
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
before update on public.goals
for each row execute function public.set_updated_at();

drop trigger if exists opportunity_actions_set_updated_at on public.opportunity_actions;
create trigger opportunity_actions_set_updated_at
before update on public.opportunity_actions
for each row execute function public.set_updated_at();

drop trigger if exists connection_preferences_set_updated_at on public.connection_preferences;
create trigger connection_preferences_set_updated_at
before update on public.connection_preferences
for each row execute function public.set_updated_at();

drop trigger if exists finance_budgets_set_updated_at on public.finance_budgets;
create trigger finance_budgets_set_updated_at
before update on public.finance_budgets
for each row execute function public.set_updated_at();

drop trigger if exists finance_goals_set_updated_at on public.finance_goals;
create trigger finance_goals_set_updated_at
before update on public.finance_goals
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.proof_posts enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_actions enable row level security;
alter table public.connection_preferences enable row level security;
alter table public.respect_locks enable row level security;
alter table public.ai_buddy_history enable row level security;
alter table public.finance_transactions enable row level security;
alter table public.finance_budgets enable row level security;
alter table public.finance_goals enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
using (auth.uid() = user_id or is_public = true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own goals" on public.goals;
create policy "Users can manage own goals"
on public.goals for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own proof posts" on public.proof_posts;
create policy "Users can manage own proof posts"
on public.proof_posts for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read opportunities" on public.opportunities;
create policy "Users can read opportunities"
on public.opportunities for select
using (true);

drop policy if exists "Users can manage own opportunity actions" on public.opportunity_actions;
create policy "Users can manage own opportunity actions"
on public.opportunity_actions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own connection preferences" on public.connection_preferences;
create policy "Users can manage own connection preferences"
on public.connection_preferences for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can create own respect locks" on public.respect_locks;
create policy "Users can create own respect locks"
on public.respect_locks for insert
with check (auth.uid() = actor_user_id);

drop policy if exists "Users can read own respect locks" on public.respect_locks;
create policy "Users can read own respect locks"
on public.respect_locks for select
using (auth.uid() = actor_user_id or auth.uid() = target_user_id);

drop policy if exists "Users can manage own AI Buddy history" on public.ai_buddy_history;
create policy "Users can manage own AI Buddy history"
on public.ai_buddy_history for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own finance transactions" on public.finance_transactions;
create policy "Users can manage own finance transactions"
on public.finance_transactions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own finance budgets" on public.finance_budgets;
create policy "Users can manage own finance budgets"
on public.finance_budgets for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own finance goals" on public.finance_goals;
create policy "Users can manage own finance goals"
on public.finance_goals for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create unique index if not exists opportunities_title_organization_key
on public.opportunities (title, organization);

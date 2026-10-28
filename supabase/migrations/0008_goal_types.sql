alter table public.goals
  add column if not exists goal_type text not null default 'daily';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'goals_goal_type_check'
      and conrelid = 'public.goals'::regclass
  ) then
    alter table public.goals
      add constraint goals_goal_type_check
      check (goal_type in ('daily', 'short_term', 'long_term'));
  end if;
end
$$;

create index if not exists goals_user_goal_type_created_at_idx
  on public.goals (user_id, goal_type, created_at);

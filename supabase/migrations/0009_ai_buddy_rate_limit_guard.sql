-- Lock the AI Buddy limiter to server-defined values so authenticated
-- clients cannot choose a shorter window to prune their own recent events.
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

  if p_limit is distinct from 20 or p_window_seconds is distinct from 60 then
    raise exception 'Invalid rate-limit configuration' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  window_start := clock_timestamp() - interval '60 seconds';

  delete from public.ai_buddy_rate_limit_events
  where user_id = p_user_id
    and occurred_at < window_start;

  select count(*)::integer
  into request_count
  from public.ai_buddy_rate_limit_events
  where user_id = p_user_id
    and occurred_at >= window_start;

  if request_count >= 20 then
    return false;
  end if;

  insert into public.ai_buddy_rate_limit_events (user_id)
  values (p_user_id);

  return true;
end;
$function$;

revoke all on function public.consume_ai_buddy_rate_limit(uuid, integer, integer) from public, anon;
grant execute on function public.consume_ai_buddy_rate_limit(uuid, integer, integer) to authenticated;

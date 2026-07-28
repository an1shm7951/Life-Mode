-- Removes duplicate seed rows and makes future seed runs idempotent.

delete from public.opportunities current_row
using public.opportunities older_row
where current_row.title = older_row.title
  and current_row.organization = older_row.organization
  and current_row.created_at > older_row.created_at;

create unique index if not exists opportunities_title_organization_key
on public.opportunities (title, organization);

revoke insert, update, delete on public.opportunities from anon, authenticated;

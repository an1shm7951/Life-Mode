-- Remove early-build placeholder copy from existing and future profiles.
update public.profiles
set display_name = ''
where display_name = 'Builder';

update public.profiles
set bio = ''
where bio = 'Building proof every week.';

alter table public.profiles
  alter column display_name set default '';

alter table public.profiles
  alter column bio set default '';

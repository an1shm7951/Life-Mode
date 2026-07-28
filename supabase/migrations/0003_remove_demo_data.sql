-- Public builds must only show real listings entered through an approved source.
delete from public.opportunities where source = 'seed';

-- Private image and document evidence for proof posts.

alter table public.proof_posts
  add column if not exists media_path text,
  add column if not exists media_name text,
  add column if not exists media_type text;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'proof-evidence',
  'proof-evidence',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload own proof evidence" on storage.objects;
create policy "Users can upload own proof evidence"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'proof-evidence'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users can read own proof evidence" on storage.objects;
create policy "Users can read own proof evidence"
on storage.objects for select to authenticated
using (
  bucket_id = 'proof-evidence'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users can delete own proof evidence" on storage.objects;
create policy "Users can delete own proof evidence"
on storage.objects for delete to authenticated
using (
  bucket_id = 'proof-evidence'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

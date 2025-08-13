-- Create public storage buckets for profile images (with fallback if create_bucket is unavailable)
do $$
begin
  perform storage.create_bucket('avatars', true);
exception when undefined_function then
  insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
end $$;

do $$
begin
  perform storage.create_bucket('covers', true);
exception when undefined_function then
  insert into storage.buckets (id, name, public)
  values ('covers', 'covers', true)
  on conflict (id) do nothing;
end $$;

-- Allow public read on these buckets
create policy "Public read avatars" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Public read covers" on storage.objects
  for select using (bucket_id = 'covers');

-- Allow authenticated users to upload/update/delete only within their own folder prefix
create policy "User upload avatars" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and name like auth.uid()::text || '/%');

create policy "User update avatars" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and name like auth.uid()::text || '/%')
  with check (bucket_id = 'avatars' and name like auth.uid()::text || '/%');

create policy "User delete avatars" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and name like auth.uid()::text || '/%');

create policy "User upload covers" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'covers' and name like auth.uid()::text || '/%');

create policy "User update covers" on storage.objects
  for update to authenticated
  using (bucket_id = 'covers' and name like auth.uid()::text || '/%')
  with check (bucket_id = 'covers' and name like auth.uid()::text || '/%');

create policy "User delete covers" on storage.objects
  for delete to authenticated
  using (bucket_id = 'covers' and name like auth.uid()::text || '/%');

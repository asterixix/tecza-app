-- Storage bucket for posts media (images/videos)
DO $$
BEGIN
  PERFORM storage.create_bucket('posts', true);
EXCEPTION WHEN undefined_function THEN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('posts','posts', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Public read for posts media
create policy "Public read posts media" on storage.objects
  for select using (bucket_id = 'posts');

-- Authenticated users can manage their own content under their folder
create policy "User insert posts media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'posts' and name like auth.uid()::text || '/%');

create policy "User update posts media" on storage.objects
  for update to authenticated
  using (bucket_id = 'posts' and name like auth.uid()::text || '/%')
  with check (bucket_id = 'posts' and name like auth.uid()::text || '/%');

create policy "User delete posts media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'posts' and name like auth.uid()::text || '/%');

-- Add tag column for discriminator and enforce (lower(username), tag) uniqueness
alter table if exists public.profiles
  add column if not exists tag integer;

-- Backfill missing tags for existing rows with a pseudo-random in 1..9999
update public.profiles
set tag = ((floor(random() * 9999)::int + 1))
where tag is null;

-- Ensure tag is within bounds
alter table public.profiles
  drop constraint if exists profiles_tag_check,
  add constraint profiles_tag_check check (tag >= 1 and tag <= 9999);

-- Drop old uniqueness on username if present and replace with case-insensitive + tag uniqueness
do $$
begin
  if exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'profiles' and c.conname = 'profiles_username_key'
  ) then
    alter table public.profiles drop constraint profiles_username_key;
  end if;
exception when undefined_table then
  -- ignore
end $$;

-- Drop legacy index if present
drop index if exists public.idx_profiles_username;

-- Create a new unique index on lower(username), tag
create unique index if not exists idx_profiles_username_tag on public.profiles (lower(username), tag);

-- Optional helper index for quick lookup by username only (case-insensitive)
create index if not exists idx_profiles_username_ci on public.profiles (lower(username));

-- Update trigger to populate username + tag from auth user metadata on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  meta_username text;
  meta_tag int;
begin
  meta_username := coalesce((new.raw_user_meta_data ->> 'username'), split_part(new.email, '@', 1));
  begin
    meta_tag := ((new.raw_user_meta_data ->> 'tag')::int);
  exception when others then
    meta_tag := null;
  end;
  if meta_tag is null or meta_tag < 1 or meta_tag > 9999 then
    meta_tag := (floor(random() * 9999)::int + 1);
  end if;

  insert into public.profiles (id, email, display_name, username, tag, profile_visibility)
  values (new.id, new.email, split_part(new.email, '@', 1), meta_username, meta_tag, 'public')
  on conflict (id) do nothing;
  return new;
end; $$;

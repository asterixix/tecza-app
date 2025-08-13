-- Profiles schema and trigger
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text,
  avatar_url text,
  cover_image_url text,
  sexual_orientation text[],
  gender_identity text[],
  pronouns text,
  email text,
  website text,
  social_links jsonb,
  city text,
  country text default 'Poland',
  profile_visibility text default 'public', -- public | friends | private
  show_location boolean default false,
  show_orientation boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Friend-aware visibility (reuse is_friend from previous migration)
create policy "Profiles select" on public.profiles
for select using (
  profile_visibility = 'public'
  or (id = auth.uid())
  or (
    profile_visibility = 'friends'
    and to_regclass('public.friendships') is not null
    and exists (
      select 1 from public.friendships f
      where (
        (f.user1_id = auth.uid() and f.user2_id = id)
        or (f.user1_id = id and f.user2_id = auth.uid())
      )
      and f.status = 'active'
    )
  )
);

create policy "Profiles update own" on public.profiles
for update using (id = auth.uid());

create policy "Profiles insert own" on public.profiles
for insert with check (id = auth.uid());

-- Trigger to create a profile on new user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name, profile_visibility)
  values (new.id, new.email, split_part(new.email, '@', 1), 'public')
  on conflict (id) do nothing;
  return new;
end; $$;

-- Attach trigger to auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create index if not exists idx_profiles_username on public.profiles (username);

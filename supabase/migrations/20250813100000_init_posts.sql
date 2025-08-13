-- Posts and social schema
create extension if not exists "uuid-ossp";

-- Basic users table for local dev (skip if using auth.users and a profiles table elsewhere)
-- In production, adapt to your actual users/profiles mapping.

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  content text not null,
  media_urls text[],
  type text not null default 'text',
  embedded_links jsonb,
  mentions uuid[],
  hashtags text[],
  visibility text not null default 'public', -- public | friends | private | unlisted
  share_token text,
  likes_count int not null default 0,
  comments_count int not null default 0,
  reposts_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_interactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null,
  type text not null check (type in ('like','comment','repost')),
  content text,
  created_at timestamptz not null default now()
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null,
  user2_id uuid not null,
  status text not null default 'active', -- active | blocked
  created_at timestamptz not null default now(),
  constraint unique_pair unique (user1_id, user2_id)
);

-- RLS
alter table public.posts enable row level security;
alter table public.post_interactions enable row level security;
alter table public.friendships enable row level security;

-- Helpers
create or replace function public.is_friend(a uuid, b uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.friendships f
    where ((f.user1_id = a and f.user2_id = b) or (f.user1_id = b and f.user2_id = a))
      and f.status = 'active'
  );
$$;

-- Policies for posts
drop policy if exists "Posts select" on public.posts;
create policy "Posts select" on public.posts
for select using (
  visibility = 'public'
  or (visibility = 'unlisted')
  or (auth.uid() = user_id)
  or (visibility = 'friends' and public.is_friend(auth.uid(), user_id))
);

drop policy if exists "Posts insert own" on public.posts;
create policy "Posts insert own" on public.posts
for insert with check (auth.uid() = user_id);

drop policy if exists "Posts update own" on public.posts;
create policy "Posts update own" on public.posts
for update using (auth.uid() = user_id);

drop policy if exists "Posts delete own" on public.posts;
create policy "Posts delete own" on public.posts
for delete using (auth.uid() = user_id);

-- Policies for post_interactions
drop policy if exists "Interactions select" on public.post_interactions;
create policy "Interactions select" on public.post_interactions
for select using (true);

drop policy if exists "Interactions insert own" on public.post_interactions;
create policy "Interactions insert own" on public.post_interactions
for insert with check (auth.uid() = user_id);

-- Friendships: allow users to view edges they are in; insertion/updates would be managed by app logic
drop policy if exists "Friendships select" on public.friendships;
create policy "Friendships select" on public.friendships
for select using (
  auth.uid() = user1_id or auth.uid() = user2_id
);

drop policy if exists "Friendships insert" on public.friendships;
create policy "Friendships insert" on public.friendships
for insert with check (auth.uid() = user1_id or auth.uid() = user2_id);

-- Indexes
create index if not exists idx_posts_user_id on public.posts(user_id);
create index if not exists idx_posts_created_at on public.posts(created_at desc);
create index if not exists idx_posts_visibility on public.posts(visibility);
create index if not exists idx_friendships_pair on public.friendships(user1_id, user2_id);

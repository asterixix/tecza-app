-- Follows table for observe functionality
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint unique_follow unique (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

alter table public.follows enable row level security;

-- Policies: anyone can read follower relationships counts, but only the follower can insert/delete their own follows
create policy "Follows select" on public.follows
for select using (true);

create policy "Follows insert own" on public.follows
for insert with check (follower_id = auth.uid());

create policy "Follows delete own" on public.follows
for delete using (follower_id = auth.uid());

create index if not exists idx_follows_follower on public.follows(follower_id);
create index if not exists idx_follows_following on public.follows(following_id);

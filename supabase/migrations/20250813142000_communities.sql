-- Communities and memberships schema
create extension if not exists "uuid-ossp";

-- Communities table
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  avatar_url text,
  cover_image_url text,
  type text not null default 'public' check (type in ('public','private','restricted')),
  category text,
  city text,
  country text,
  is_local boolean not null default false,
  members_count integer not null default 0,
  owner_id uuid not null,
  moderators uuid[] not null default '{}',
  has_chat boolean not null default false,
  has_events boolean not null default true,
  has_wiki boolean not null default false,
  created_at timestamptz not null default now()
);

-- Community memberships
create table if not exists public.community_memberships (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('owner','moderator','member')),
  joined_at timestamptz not null default now(),
  unique (community_id, user_id)
);

-- RLS
alter table public.communities enable row level security;
alter table public.community_memberships enable row level security;

-- Policies: Communities
drop policy if exists "Communities public view" on public.communities;
create policy "Communities public view" on public.communities
for select using (
  type = 'public' OR
  owner_id = auth.uid() OR
  exists(
    select 1 from public.community_memberships m
    where m.community_id = communities.id and m.user_id = auth.uid()
  )
);

drop policy if exists "Communities insert" on public.communities;
create policy "Communities insert" on public.communities
for insert with check (auth.uid() = owner_id);

drop policy if exists "Communities update owner" on public.communities;
create policy "Communities update owner" on public.communities
for update using (auth.uid() = owner_id);

drop policy if exists "Communities delete owner" on public.communities;
create policy "Communities delete owner" on public.communities
for delete using (auth.uid() = owner_id);

-- Policies: Memberships
drop policy if exists "Memberships view own and by owners" on public.community_memberships;
create policy "Memberships view own and by owners" on public.community_memberships
for select using (
  user_id = auth.uid() OR
  exists(select 1 from public.communities c where c.id = community_memberships.community_id and c.owner_id = auth.uid())
);

drop policy if exists "Memberships join public" on public.community_memberships;
create policy "Memberships join public" on public.community_memberships
for insert with check (
  user_id = auth.uid() and exists(
    select 1 from public.communities c
    where c.id = community_id and c.type = 'public'
  ) and role = 'member'
);

drop policy if exists "Memberships manage by owner" on public.community_memberships;
create policy "Memberships manage by owner" on public.community_memberships
for insert with check (
  exists(select 1 from public.communities c where c.id = community_id and c.owner_id = auth.uid())
) ;

drop policy if exists "Memberships leave" on public.community_memberships;
create policy "Memberships leave" on public.community_memberships
for delete using (user_id = auth.uid());

drop policy if exists "Memberships owner remove" on public.community_memberships;
create policy "Memberships owner remove" on public.community_memberships
for delete using (
  exists(select 1 from public.communities c where c.id = community_id and c.owner_id = auth.uid())
);

-- Indexes
create index if not exists idx_communities_owner on public.communities(owner_id);
create index if not exists idx_communities_type on public.communities(type);
create index if not exists idx_communities_city on public.communities(city);
create index if not exists idx_communities_category on public.communities(category);
create index if not exists idx_memberships_user on public.community_memberships(user_id);
create index if not exists idx_memberships_community on public.community_memberships(community_id);

-- Simple member count triggers
create or replace function public.community_member_inc() returns trigger language plpgsql as $$
begin
  update public.communities set members_count = members_count + 1 where id = NEW.community_id;
  return NEW;
end;$$;

create or replace function public.community_member_dec() returns trigger language plpgsql as $$
begin
  update public.communities set members_count = greatest(members_count - 1, 0) where id = OLD.community_id;
  return OLD;
end;$$;

drop trigger if exists trg_member_inc on public.community_memberships;
create trigger trg_member_inc after insert on public.community_memberships
for each row execute function public.community_member_inc();

drop trigger if exists trg_member_dec on public.community_memberships;
create trigger trg_member_dec after delete on public.community_memberships
for each row execute function public.community_member_dec();

-- Storage buckets for communities (avatars/covers)
DO $$ BEGIN
  PERFORM 1 FROM storage.buckets WHERE id = 'community-avatars';
  IF NOT FOUND THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('community-avatars','community-avatars', true);
  END IF;
  PERFORM 1 FROM storage.buckets WHERE id = 'community-covers';
  IF NOT FOUND THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('community-covers','community-covers', true);
  END IF;
END $$;

-- Note: We scope to exact bucket IDs to avoid interfering with other storage policies
drop policy if exists "Public read community assets" on storage.objects;
create policy "Public read community assets" on storage.objects for select using (bucket_id in ('community-avatars','community-covers'));

drop policy if exists "Auth write community assets" on storage.objects;
create policy "Auth write community assets" on storage.objects for insert to authenticated with check (bucket_id in ('community-avatars','community-covers'));

drop policy if exists "Auth update community assets" on storage.objects;
create policy "Auth update community assets" on storage.objects for update to authenticated using (bucket_id in ('community-avatars','community-covers')) with check (bucket_id in ('community-avatars','community-covers'));

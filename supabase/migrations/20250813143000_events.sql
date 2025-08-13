-- Events schema and participation with RLS
create extension if not exists "uuid-ossp";

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  city text,
  country text,
  coordinates jsonb,
  start_date timestamptz not null,
  end_date timestamptz,
  timezone text not null default 'Europe/Warsaw',
  organizer_id uuid not null,
  community_id uuid references public.communities(id) on delete set null,
  category text not null default 'other' check (category in ('pride','support','social','activism','education','other')),
  is_online boolean not null default false,
  is_free boolean not null default true,
  max_participants integer,
  visibility text not null default 'public' check (visibility in ('public','friends','community','private')),
  requires_approval boolean not null default false,
  cover_image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.event_participations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null,
  status text not null check (status in ('interested','attending','not_attending')),
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- RLS
alter table public.events enable row level security;
alter table public.event_participations enable row level security;

-- Visibility policy for events
drop policy if exists "Events select visibility" on public.events;
create policy "Events select visibility" on public.events
for select using (
  visibility = 'public'
  or organizer_id = auth.uid()
  or (visibility = 'friends' and public.is_friend(organizer_id, auth.uid()))
  or (visibility = 'community' and exists (
    select 1 from public.community_memberships m where m.community_id = events.community_id and m.user_id = auth.uid()
  ))
);

drop policy if exists "Events insert own" on public.events;
create policy "Events insert own" on public.events
for insert with check (
  organizer_id = auth.uid() and (
    community_id is null or exists (
      select 1 from public.community_memberships m where m.community_id = events.community_id and m.user_id = auth.uid() and m.role in ('owner','moderator')
    )
  )
);

drop policy if exists "Events update own" on public.events;
create policy "Events update own" on public.events for update using (organizer_id = auth.uid());

drop policy if exists "Events delete own" on public.events;
create policy "Events delete own" on public.events for delete using (organizer_id = auth.uid());

-- Participation policies
drop policy if exists "Event participations view" on public.event_participations;
create policy "Event participations view" on public.event_participations
for select using (
  user_id = auth.uid() or exists (
    select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid()
  )
);

drop policy if exists "Event participations upsert self" on public.event_participations;
create policy "Event participations upsert self" on public.event_participations
for insert with check (
  user_id = auth.uid() and exists (
    select 1 from public.events e where e.id = event_id
  )
);

drop policy if exists "Event participations update self" on public.event_participations;
create policy "Event participations update self" on public.event_participations
for update using (user_id = auth.uid());

drop policy if exists "Event participations delete self" on public.event_participations;
create policy "Event participations delete self" on public.event_participations
for delete using (user_id = auth.uid());

-- Indexes
create index if not exists idx_events_start on public.events(start_date);
create index if not exists idx_events_city on public.events(city);
create index if not exists idx_events_category on public.events(category);

-- Storage bucket for event covers
DO $$ BEGIN
  PERFORM 1 FROM storage.buckets WHERE id = 'event-covers';
  IF NOT FOUND THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('event-covers','event-covers', true);
  END IF;
END $$;

-- Storage policies for event covers
drop policy if exists "Public read event covers" on storage.objects;
create policy "Public read event covers" on storage.objects for select using (bucket_id = 'event-covers');

drop policy if exists "Auth write event covers" on storage.objects;
create policy "Auth write event covers" on storage.objects for insert to authenticated with check (bucket_id = 'event-covers');

drop policy if exists "Auth update event covers" on storage.objects;
create policy "Auth update event covers" on storage.objects for update to authenticated using (bucket_id = 'event-covers') with check (bucket_id = 'event-covers');

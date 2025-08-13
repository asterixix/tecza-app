-- Friend requests table for pending/accept flow
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending', -- pending | accepted | rejected | cancelled
  message text,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

alter table public.friend_requests enable row level security;

-- Only sender/receiver can see their requests
create policy "Friend requests select" on public.friend_requests
for select using (
  sender_id = auth.uid() or receiver_id = auth.uid()
);

-- Only sender can insert a request
create policy "Friend requests insert" on public.friend_requests
for insert with check (
  sender_id = auth.uid()
);

-- Only receiver can accept/reject; sender can cancel
create policy "Friend requests update" on public.friend_requests
for update using (
  sender_id = auth.uid() or receiver_id = auth.uid()
) with check (
  sender_id = auth.uid() or receiver_id = auth.uid()
);

create index if not exists idx_friend_requests_receiver on public.friend_requests(receiver_id, status);
create index if not exists idx_friend_requests_sender on public.friend_requests(sender_id, status);

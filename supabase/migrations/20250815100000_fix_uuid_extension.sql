-- Ensure pgcrypto is available for gen_random_uuid()
create extension if not exists pgcrypto;

-- Re-assert default in case it was created before the extension existed
alter table if exists public.communities
  alter column id set default gen_random_uuid();

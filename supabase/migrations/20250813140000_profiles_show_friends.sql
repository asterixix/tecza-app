-- Add show_friends visibility flag for friends list
alter table public.profiles add column if not exists show_friends boolean default true;

-- No RLS policy change needed; client enforces visibility on UI.

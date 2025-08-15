-- Ensure posts has hashtags and mentions columns (if not yet present)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS hashtags text[];
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS mentions uuid[];
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON public.posts USING GIN (hashtags);

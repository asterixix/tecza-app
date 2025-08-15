-- Add support for rainbow likes, comments with replies, and reshares
-- Migration: 20250815120000_posts_interactions.sql

-- Create likes table with rainbow theme support
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rainbow_color TEXT DEFAULT 'red' CHECK (rainbow_color IN ('red', 'orange', 'yellow', 'green', 'blue', 'purple')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create comments table with reply support
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 2000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add reshare support to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_reshare BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS original_post_id UUID REFERENCES posts(id) ON DELETE CASCADE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reshare_comment TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_posts_original_post_id ON posts(original_post_id);

-- Enable RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_likes
CREATE POLICY "Users can view all likes" ON post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" ON post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for post_comments
CREATE POLICY "Users can view comments on visible posts" ON post_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_comments.post_id 
      AND (
        posts.visibility = 'public' 
        OR posts.user_id = auth.uid()
        OR (posts.visibility = 'friends' AND posts.user_id IN (
          SELECT CASE 
            WHEN user1_id = auth.uid() THEN user2_id 
            ELSE user1_id 
          END 
          FROM friendships 
          WHERE (user1_id = auth.uid() OR user2_id = auth.uid()) 
          AND status = 'active'
        ))
      )
    )
  );

CREATE POLICY "Users can create comments" ON post_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_comments.post_id 
      AND (
        posts.visibility = 'public' 
        OR posts.user_id = auth.uid()
        OR (posts.visibility = 'friends' AND posts.user_id IN (
          SELECT CASE 
            WHEN user1_id = auth.uid() THEN user2_id 
            ELSE user1_id 
          END 
          FROM friendships 
          WHERE (user1_id = auth.uid() OR user2_id = auth.uid()) 
          AND status = 'active'
        ))
      )
    )
  );

CREATE POLICY "Users can edit their own comments" ON post_comments
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Update posts RLS to allow reshares
DROP POLICY IF EXISTS "Users can create posts" ON posts;
CREATE POLICY "Users can create posts" ON posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND (
      NOT is_reshare 
      OR (is_reshare AND original_post_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM posts original
        WHERE original.id = posts.original_post_id 
        AND (
          original.visibility = 'public' 
          OR original.user_id = auth.uid()
          OR (original.visibility = 'friends' AND original.user_id IN (
            SELECT CASE 
              WHEN user1_id = auth.uid() THEN user2_id 
              ELSE user1_id 
            END 
            FROM friendships 
            WHERE (user1_id = auth.uid() OR user2_id = auth.uid()) 
            AND status = 'active'
          ))
        )
      ))
    )
  );

-- Functions to update like and comment counts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON post_likes;
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON post_comments;
CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

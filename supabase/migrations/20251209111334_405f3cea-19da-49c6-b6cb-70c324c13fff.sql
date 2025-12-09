-- Add proper UNIQUE constraint on blog_id for ON CONFLICT to work
-- First drop the partial unique index that doesn't support ON CONFLICT
DROP INDEX IF EXISTS tiktok_video_queue_blog_id_unique;

-- Add a real UNIQUE constraint on blog_id (allows NULL values, only enforces uniqueness on non-NULL)
ALTER TABLE tiktok_video_queue 
ADD CONSTRAINT tiktok_video_queue_blog_id_unique UNIQUE (blog_id);

-- Do the same for music_story_id
DROP INDEX IF EXISTS tiktok_video_queue_music_story_id_unique;

ALTER TABLE tiktok_video_queue 
ADD CONSTRAINT tiktok_video_queue_music_story_id_unique UNIQUE (music_story_id);
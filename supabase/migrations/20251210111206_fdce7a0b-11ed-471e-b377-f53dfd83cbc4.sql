-- Drop the restrictive check constraint and add 'manual' as valid option
ALTER TABLE render_jobs DROP CONSTRAINT IF EXISTS render_jobs_source_type_check;
ALTER TABLE render_jobs ADD CONSTRAINT render_jobs_source_type_check 
  CHECK (source_type IN ('blog_post', 'music_story', 'single', 'manual'));